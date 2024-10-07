// templates/[[...slugList]].tsx

import {type GetServerSideProps} from 'next';
import React, {
  useEffect,
  useState,
  useRef,
  useMemo,
  forwardRef,
  type CSSProperties,
  type PropsWithChildren
} from 'react';
import LandingLayout from "../../shared/ui/LandingLayout";
import {type TagValueMsgLabelType, useCurrentLocale, useI18n, useScopedI18n} from "@fontsensei/locales";
import {useRouter} from "next/router";
import Link from "next/link";
import Head from "next/head";
import {PRODUCT_NAME} from "../productConstants";
import {getLocaleContent} from "../../shared/getStaticPropsLocale";
import AutoSizer from "react-virtualized-auto-sizer";
import {FixedSizeList as List} from "react-window";
import {GoogleFontHeaders} from "@fontsensei/components/GoogleFontHeaders";
import {debounce} from "lodash-es";
import {cx} from "@emotion/css";
import listFonts from "@fontsensei/core/listFonts";
import {type FSFontItem} from "@fontsensei/core/types";
import languageSpecificTags from "@fontsensei/data/raw/fontSensei/languageSpecificTags";
import VirtualList from "@fontsensei/components/VirtualList";
import {MdOutlineFeedback} from "react-icons/md";
import useFeedbackStore from "../feedback/useFeedbackStore";
import {MenuItem} from "../landing/Navbar";
import FeedbackModal from "../feedback/FeedbackModal";
import {tClient} from "../../shared/api";
import {toast} from "react-toastify";

const PAGE_SIZE = 10;

interface PageProps {
  initialFontItemList: FSFontItem[];
  countByTags: Record<string, number>;
  firstFontByTags: Record<string, string>;
  extraMenuItems?: MenuItem[];
  onAddTag?: (fontName: string, tagName: string, msg: string) => void;
  onRemoveTag?: (fontName: string, tagName: string, msg: string) => void;
}

const TagButton = (props: PropsWithChildren<{
  isActive: boolean,
  tag: string,
  font: string | undefined,
  href: Parameters<typeof Link>[0]['href'],
}>) => {
  const {isActive, tag, font, href, children} = props;

  return <Link
    type="button"
    key={tag}
    className={cx(
      // "focus:ring-4 focus:ring-gray-300",
      "text-gray-900 bg-white/50 text-xl font-medium text-center",
      "border-4 focus:outline-none rounded px-2 py-1",
      (
        isActive
          ? "border-primary hover:border-primary"
          : "border-transparent hover:border-gray-200"
      )
    )}
    href={href}
    style={{
      fontFamily: font,
    }}
  >
    {children}
  </Link>;
}

const FontPickerPage = (props: PageProps) => {
  const t = useI18n();
  const currentLocale = useCurrentLocale();
  const tLandingMsg = useScopedI18n('landingMsg');
  const tTagValueMsg = useScopedI18n('tagValueMsg');
  const router = useRouter();
  const tagValue = router.query.slugList?.[0];
  const tagDisplayName = useMemo(
    () => tTagValueMsg(tagValue as TagValueMsgLabelType),
    [tagValue]
  );

  const [initialFontItemList, setInitialFontItemList] = useState<FSFontItem[]>(props.initialFontItemList);
  const lastTagValueRef = useRef(tagValue);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (lastTagValueRef.current === tagValue) {
      return;
    }
    lastTagValueRef.current = tagValue;

    setInitialFontItemList([]);
    setLoading(true);
    void listFonts({
      tagValue: tagValue,
      skip: 0,
      take: PAGE_SIZE
    }).then((response) => {
      setInitialFontItemList(response);
      setLoading(false);
    });
  }, [tagValue]);

  const titlePrefix = tagDisplayName
    ? (
      tLandingMsg('Google fonts tagged {tagName}', {
        tagName: tagDisplayName,
      }) + ' - '
    )
    : '';
  const title = titlePrefix + PRODUCT_NAME + ' - ' + t('product.slogan');

  const langTagList = useMemo(() => languageSpecificTags[currentLocale], [currentLocale]);
  const tagList = useMemo(
    () => [...Object.keys(props.countByTags)]
      .filter(t => !langTagList.includes(t)),
    [props.countByTags, langTagList]
  );

  const allFontConfigList = useMemo(
    () =>
      Object.keys(props.firstFontByTags).reduce(
        (acc, tag) => [...acc, {name: props.firstFontByTags[tag]!, text: tag}],
        [] as { name: string; text: string }[],
      ),
    [props.firstFontByTags]
  );

  return (
    <LandingLayout fullWidth={true} className="relative">
      <Head>
        <title>{title}</title>
        <GoogleFontHeaders preConnect={true} configList={allFontConfigList} strategy="block"/>
      </Head>

      <div className="flex h-[calc(100vh-6rem)]">
        <div className="p-4 flex-0 w-[40%] min-w-[200px] h-full overflow-scroll">
          <div className="font-normal mb-4">
            {
              (tagValue === 'all' || !tagValue)
                ? <h2>{t('product.description', {productName: PRODUCT_NAME})}</h2>
                : tLandingMsg('Free font tagged {tagValue} provided by Google fonts', {
                  tagValue: tagDisplayName,
                })
            }
          </div>
          <div className="flex items-center justify-start flex-wrap gap-2">
            {
              [
                'all',
                ...langTagList,
                ...tagList
              ].map((t) => <TagButton
                key={t}
                isActive={(tagValue === t) || ((t === "all") && !tagValue)}
                tag={t}
                font={props.firstFontByTags[t]}
                href={(t === 'all' || !t) ? "/" : `/tag/${t}`}>
                {tTagValueMsg(t as TagValueMsgLabelType)} {props.countByTags[t]}
              </TagButton>)
            }
          </div>
        </div>
        <div className="p-4 flex-1 h-full overflow-scroll">
          {!loading && <VirtualList tagValue={tagValue} initialFontItemList={initialFontItemList} pageSize={PAGE_SIZE}/>}
          {loading && <span className="loading loading-bars loading-sm"/>}
        </div>
      </div>
    </LandingLayout>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const slugList = context.params?.slugList ?? [];
  const tagValue = Array.isArray(slugList) ? slugList[0] : undefined;

  const initialFontItemList = await listFonts({
    tagValue: tagValue,
    skip: 0,
    take: PAGE_SIZE
  });

  return {
    props: {
      initialFontItemList,
      locale: await getLocaleContent(context.locale),
      countByTags: await import("../../../public/data/countByTags.json").then(res => res.default as Record<string, number>),
      firstFontByTags: await import("../../../public/data/firstFontByTags.json").then(res => res.default as Record<string, string>),
    } as PageProps
  };
};

export default FontPickerPage;
