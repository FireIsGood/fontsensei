import React, {type CSSProperties, forwardRef, useEffect, useState} from "react";
import {type FSFontItem} from "@fontsensei/core/types";
import listFonts from "@fontsensei/core/listFonts";
import {TagValueMsgLabelType, useScopedI18n} from "@fontsensei/locales";
import {debounce} from "lodash-es";
import {GoogleFontHeaders} from "@fontsensei/components/GoogleFontHeaders";
import AutoSizer from "react-virtualized-auto-sizer";
import {FixedSizeList as List} from "react-window";
import {cx} from "@emotion/css";

const ITEM_HEIGHT = 140;
const ITEM_HEIGHT_CLS = 'h-[140px]';

// add a function onOuterWheel to window typing
declare global {
  interface Window {
    onOuterWheel?: (el: HTMLDivElement | null) => void;
  }
}

type RowProps = {
  index: number,
  style: CSSProperties,
  fontItem?: FSFontItem,
  text: string,
  onWheel?: (event: React.WheelEvent<HTMLDivElement>) => void,
  forwardedRef: React.Ref<HTMLDivElement>
};

const Row = ({index, style, fontItem, text, onWheel, forwardedRef}: RowProps) => {
  const tTagValueMsg = useScopedI18n('tagValueMsg');

  if (!fontItem) {
    return <div key="END" className="h-[100px] overflow-hidden" style={style} onWheel={onWheel} ref={forwardedRef}
                data-itemindex={index}>
      <div className="text-center">
        THE END
      </div>
    </div>
  }

  return <div
    key={fontItem.name}
    className={cx(
      ITEM_HEIGHT_CLS,
      "overflow-hidden cursor-pointer p-2 rounded-2xl",
      "hover:shadow-xl hover:bg-white/10",
    )}
    style={style}
    onWheel={onWheel}
    ref={forwardedRef}
    data-itemindex={index}
  >
    <a
      href={'https://fonts.google.com/specimen/' + fontItem.name.split(' ').join('+')}
      target="_blank"
      className="inline-block h-full w-full"
    >
      <div
        className={cx(
          "text-xl",
          "flex items-center justify-start gap-1 mb-2"
        )}
        style={{whiteSpace: 'nowrap', overflow: 'auto hidden'}}
      >
        <span>
          #{index + 1}
        </span>
        <span className="font-bold badge badge-neutral badge-lg">
          {fontItem.name}
        </span>
        {fontItem.tags.map((tag) => {
          return <span className="badge badge-ghost bg-white/30">{tTagValueMsg(tag as TagValueMsgLabelType)}</span>;
        })}
      </div>
      <div
        className="text-4xl rounded px-2 "
        style={{
          fontFamily: `"${fontItem.name}"`,
          whiteSpace: 'nowrap',
          overflow: 'auto hidden'
        }}
      >
        {text}
      </div>
    </a>
  </div>;
};

const RefForwardedRow = React.forwardRef<HTMLDivElement, Omit<RowProps, 'forwardedRef'>>((props, ref) => (
  <Row {...props} forwardedRef={ref}/>
));

const createOuterElementType = forwardRef<HTMLDivElement>((props, ref) => (
  <div
    id="outer"
    ref={ref}
    onWheel={(e) => window.onOuterWheel?.(e.currentTarget)}
    {...props}
  />
));

const VirtualList = ({
  tagValue,
  initialFontItemList,
  pageSize,
}: { tagValue: string | undefined, initialFontItemList: FSFontItem[], pageSize: number }) => {
  const [list, setList] = useState(initialFontItemList);

  useEffect(() => {
    // console.log('changed', tagValue, initialFontItemList);
    setList(initialFontItemList);
    void listFonts({
      tagValue,
      skip: pageSize,
      take: 10000,
    }).then(res => {
      setList(prev => [...prev, ...res])
    });
  }, [tagValue, initialFontItemList]);


  const [configList, setConfigList] = useState([] as { name: string, text?: string }[]);

  const tProduct = useScopedI18n('product');
  const lorem = tProduct('lorem');
  const [text, setText] = useState('123,Abc! ' + lorem);
  useEffect(() => {
    setText('123,Abc! ' + lorem);
  }, [lorem]);

  useEffect(() => {
    const delayedUpdate = debounce((start, count) => {
      setConfigList(
        list.slice(
          start,
          start + count,
        ).map(fontItem => ({name: fontItem.name, text: text})),
      );
    }, 1000);
    window.onOuterWheel = (el) => {
      if (!el) {
        return;
      }

      const visibleRowIndex = el.scrollTop / ITEM_HEIGHT;
      const totalHeight = el.clientHeight;
      const numberOfItemsVisible = totalHeight / ITEM_HEIGHT;
      const start = Math.floor(visibleRowIndex);
      const count = Math.ceil(numberOfItemsVisible) + 1;

      delayedUpdate(start, count);
    }

    window.onOuterWheel(
      document.querySelector('#outer')
    );
  }, [list, text]);

  return <>
    <GoogleFontHeaders preConnect={false} configList={configList} strategy="block"/>
    <AutoSizer>
      {({height, width}) => (
        <List
          className="List"
          outerElementType={createOuterElementType}
          height={height}
          width={width}
          itemCount={list.length + 1}
          itemSize={ITEM_HEIGHT}
        >
          {(props) => <RefForwardedRow {...props} fontItem={list[props.index]} text={text}/>}
        </List>
      )}
    </AutoSizer>
  </>;
};

export default VirtualList;
