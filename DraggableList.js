import {View, Text, ScrollView, Dimensions} from 'react-native';
import React from 'react';
import {MARGIN, SIZE, COL, HEIGHT} from './Utils';
import Item from './Item';
import Animated, {
  useSharedValue,
  useAnimatedRef,
  useAnimatedScrollHandler,
  scrollTo,
} from 'react-native-reanimated';
import {GestureHandlerRootView} from 'react-native-gesture-handler';

const window = Dimensions.get('window');
export default function DraggableList(props) {
  const scrollViewRef = React.useRef();
  const scrollY = useSharedValue(0);
  const containerStartY = useSharedValue(0);
  const onScroll = event => {
    scrollY.value = event.nativeEvent.contentOffset.y;
  };
  const numOfColumns = props.numOfColumns ? props.numOfColumns : 1;
  const itemHeight = props.itemHeight ? props.itemHeight : 50;
  const containerWidth = props.containerWidth
    ? props.containerWidth
    : window.width;
  const positions = useSharedValue({
    mainContainer: Object.assign(
      {},
      ...props.data?.map((item, index) => ({[item.id]: index})),
    ),
  });

  const allChildrenPositions = useSharedValue({});
  let scrollViewContainerHeight = 0;
  let allChildrenList = [];

  let handlePositionsWithOrder = () => {
    let output = {};
    for (let item of props.data) {
      let index = props.data.indexOf(item);
      let order = 0;
      let childrenPositions = {};
      output[item.id] = {order: index, children: {}};
      scrollViewContainerHeight += props.titleHeight;

      for (let child of item.children) {
        let childIndex = item.children.indexOf(child);
        scrollViewContainerHeight += props.itemHeight;
        childrenPositions[child.id] = order;
        allChildrenList.push({containerID: item.id, child: child});
        output[item.id].children[child.id] = {
          order: childIndex,
        };
        order++;
      }
    }
    return output;
  };

  let positionsWithOrder = useSharedValue(handlePositionsWithOrder());
  // console.log([...props.data], positionsWithOrder.value);
  let sharedData = useSharedValue(props.data);
  return (
    <ScrollView
      onScroll={onScroll}
      ref={scrollViewRef}
      contentContainerStyle={{
        // height: Math.ceil(props.data.length / numOfColumns) * itemHeight,
        height: scrollViewContainerHeight,
        alignItems: 'center',
      }}
      showsVerticalScrollIndicator={false}
      bounces={false}
      scrollEventThrottle={16}>
      <View style={{alignItems: 'center', width: containerWidth}}>
        {sharedData.value?.map((item, index) => {
          return (
            <Item
              onLayout={({nativeEvent}) => {
                containerStartY.value = nativeEvent.layout.y;
                positionsWithOrder.value[item.id].offsetY =
                  nativeEvent.layout.y;
              }}
              key={item.id}
              id={item.id}
              index={index}
              data={sharedData}
              positions={positions}
              positionsWithOrder={positionsWithOrder}
              scrollY={scrollY}
              containerStartY={containerStartY}
              containerWidth={containerWidth}
              contentHeight={scrollViewContainerHeight}
              itemHeight={
                item.children.length * props.itemHeight + props.titleHeight
              }
              titleHeight={props.titleHeight}
              numOfColumns={numOfColumns}
              container={true}
              onReorder={data => {
                props.onReorder(data);
              }}
              containerID={'mainContainer'}
              scrollViewRef={scrollViewRef}>
              <View
                style={{height: props.titleHeight, justifyContent: 'center'}}>
                {props.renderTitle ? props.renderTitle(item) : null}
              </View>
              <View style={{justifyContent: 'center'}}>
                {item.children.map((child, childIndex) => {
                  return (
                    <Item
                      key={child.id}
                      id={child.id}
                      parentIndex={index}
                      index={childIndex}
                      data={sharedData}
                      contentHeight={scrollViewContainerHeight}
                      containerStartY={containerStartY}
                      onReorder={data => {
                        props.onReorder(data);
                      }}
                      positionsWithOrder={positionsWithOrder}
                      positions={allChildrenPositions}
                      scrollY={scrollY}
                      containerWidth={containerWidth}
                      itemHeight={props.itemHeight}
                      titleHeight={props.titleHeight}
                      numOfColumns={numOfColumns}
                      child={true}
                      containerID={item.id}
                      scrollViewRef={scrollViewRef}>
                      {props.renderItem ? props.renderItem(child) : null}
                    </Item>
                  );
                })}
              </View>
            </Item>
          );
        })}
      </View>
      {/* {allChildrenList.map(item => {
        let child = item.child;
        return (
          <Item
            key={child.id}
            id={child.id}
            data={props.data}
            onReorder={data => {
              props.onReorder(data);
            }}
            positions={allChildrenPositions}
            scrollY={scrollY}
            containerWidth={containerWidth}
            itemHeight={props.itemHeight}
            titleHeight={props.titleHeight}
            numOfColumns={numOfColumns}
            itemsContainerOffset={itemsContainerOffset}
            child={true}
            containerID={item.containerID}
            scrollViewRef={scrollViewRef}>
            {props.renderItem ? props.renderItem(child) : null}
          </Item>
        );
      })} */}
    </ScrollView>
  );
}
