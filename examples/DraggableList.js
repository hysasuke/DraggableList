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
  const itemsContainerOffset = useSharedValue(0);
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
  for (let item of props.data) {
    let order = 0;
    let childrenPositions = {};
    scrollViewContainerHeight += props.titleHeight;
    // console.log(item);
    for (let child of item.children) {
      scrollViewContainerHeight += props.itemHeight;
      childrenPositions[child.id] = order;
      allChildrenList.push({containerID: item.id, child: child});
      order++;
    }
    allChildrenPositions.value[item.id] = childrenPositions;
  }
  return (
    <ScrollView
      onScroll={onScroll}
      ref={scrollViewRef}
      contentContainerStyle={{
        // height: Math.ceil(props.data.length / numOfColumns) * itemHeight,
        height: scrollViewContainerHeight,
      }}
      showsVerticalScrollIndicator={false}
      bounces={false}
      style={{paddingHorizontal: 20}}
      scrollEventThrottle={16}>
      <View
        onLayout={({nativeEvent}) => {
          itemsContainerOffset.value = nativeEvent.layout.y;
        }}>
        {props.data?.map((item, index) => {
          return (
            <Item
              key={item.id}
              id={item.id}
              data={props.data}
              positions={positions}
              scrollY={scrollY}
              containerWidth={containerWidth}
              itemHeight={
                item.children.length * props.itemHeight + props.titleHeight
              }
              titleHeight={props.titleHeight}
              numOfColumns={numOfColumns}
              itemsContainerOffset={itemsContainerOffset}
              container={true}
              onReorder={props.onReorder}
              containerID={'mainContainer'}
              scrollViewRef={scrollViewRef}>
              <View
                style={{height: props.titleHeight, justifyContent: 'center'}}>
                {props.renderTitle ? props.renderTitle(item) : null}
              </View>
              <View style={{justifyContent: 'center'}}>
                {item.children.map(child => {
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
