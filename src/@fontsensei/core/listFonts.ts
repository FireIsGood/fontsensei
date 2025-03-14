import {type FSFontFilterOptions, type FSFontItem} from "./types";
import getMetadata from "@fontsensei/core/getMetadata";
import invariant from "tiny-invariant";

const ENABLE_CACHE = true;
let _serverCache = undefined as FSFontItem[] | undefined;
let _clientCache = undefined as FSFontItem[] | undefined;
let _clientCachePromise = undefined as Promise<FSFontItem[]> | undefined;

const toFontItemList = async (jsonObj: object) => {
  const list = [] as FSFontItem[];
  for (const fontName of Object.keys(jsonObj)) {
    const metadata = await getMetadata(fontName);
    invariant(metadata);
    list.push({
      family: fontName,
      tags: (jsonObj as Record<string, string[]>)[fontName],
      metadata: metadata,
    } as FSFontItem);
  }
  return list;
};

const filterByOpts = (list: FSFontItem[], opts: FSFontFilterOptions) => {
  const filteredList = [] as FSFontItem[];
  for (const font of list) {
    const hitTag = (opts.tagValue === "all") || (font.tags.indexOf(opts.tagValue) >= 0);
    const hitText = !opts.filterText || (font.family.toLowerCase().indexOf(opts.filterText.toLowerCase()) >= 0);

    if (hitTag && hitText) {
      filteredList.push(font);
    }

    if (filteredList.length >= (opts.skip + opts.take)) {
      break;
    }
  }

  return filteredList.slice(opts.skip, opts.skip + opts.take);
}

const listFonts = async (opts: FSFontFilterOptions) => {
  if (typeof window === 'undefined') {
    if (_serverCache) {
      return filterByOpts(_serverCache, opts);
    }

    // reading the file from public/merged.json on server side,
    const mod = await import(`../../../public/data/tagsByName.json`);
    const list = await toFontItemList(mod.default);

    if (ENABLE_CACHE) {
      _serverCache = list;
    }

    return filterByOpts(list, opts);
  }

  if (_clientCache) {
    // force make this function async
    // otherwise React will combine loading state and the initial list is not refreshed
    await new Promise((resolve) => setTimeout(resolve, 1));

    return filterByOpts(_clientCache, opts);
  }

  if (!_clientCachePromise) {
    _clientCachePromise = fetch(`/data/tagsByName.json`).then((res) => {
      return res.json();
    }).then((json) => {
      return toFontItemList(json);
    });
  }

  _clientCache = await _clientCachePromise;

  return filterByOpts(_clientCache, opts);
};

export default listFonts;
