import {View, Text, StyleSheet, Dimensions} from 'react-native';
import React from 'react';
import {
  getPosition,
  SIZE,
  animationConfig,
  getOrder,
  COL,
  HEIGHT,
} from './Utils';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedGestureHandler,
  withTiming,
  useAnimatedReaction,
  useAnimatedRef,
  scrollTo,
} from 'react-native-reanimated';
import {
  PanGestureHandler,
  LongPressGestureHandler,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

function handleGetContainerStartY(positionsWithOrder, id, type) {
  if (type === 'container') {
    return positionsWithOrder.value[id].offsetY;
  } else if (type === 'child') {
    const container = Object.keys(positionsWithOrder.value).find(key =>
      Object.keys(positionsWithOrder.value[key].children).find(
        child => child === id,
      ),
    );
    return positionsWithOrder.value[container].offsetY;
  }
}
export default function Item(props) {
  let {scrollY, positionsWithOrder, scrollViewRef, data, contentHeight} = props;
  let fromIndex = useSharedValue();
  const containerStartY = useSharedValue(
    handleGetContainerStartY(
      positionsWithOrder,
      props.id,
      props.container ? 'container' : 'child',
    ),
  );
  const currentOrder = props.container
    ? props.positionsWithOrder.value[props.id].order
    : props.positionsWithOrder.value[props.containerID].children[props.id]
        .order;
  let position = getPosition(
    currentOrder,
    props.containerWidth,
    props.itemHeight,
    props.numOfColumns,
    containerStartY,
  );

  if (props.container) {
    props.positionsWithOrder.value[props.id]['offsetY'] = position.y;
  }

  if (props.onLayout) {
    props.onLayout({nativeEvent: {layout: position}});
  }

  const translateX = useSharedValue(position.x);
  const translateY = useSharedValue(position.y);
  const inset = useSafeAreaInsets();
  const containerHeight =
    Dimensions.get('window').height - inset.top - inset.bottom;
  // const contentHeight = useSharedValue(
  //   props.container
  //     ? (Object.keys(props.positionsWithOrder.value).length /
  //         props.numOfColumns) *
  //         props.itemHeight
  //     : (Object.keys(props.positionsWithOrder.value[props.containerID].children)
  //         .length /
  //         props.numOfColumns) *
  //         props.itemHeight,
  // );
  const isGestureActive = useSharedValue(false);
  const shouldMoveItem = useSharedValue(false);

  const longPressTimer = useSharedValue(null);
  useAnimatedReaction(
    () => {
      // console.log(props.containerID);
      if (props.container) {
        return props.positionsWithOrder.value[props.id].order;
      } else if (props.child) {
        return props.positionsWithOrder.value[props.containerID].children[
          props.id
        ].order;
      }
    },
    newOrder => {
      fromIndex.value = newOrder;
      const newPosition = getPosition(
        newOrder,
        props.containerWidth,
        props.itemHeight,
        props.numOfColumns,
        containerStartY,
      );

      translateX.value = withTiming(newPosition.x, animationConfig);
      translateY.value = withTiming(newPosition.y, animationConfig);
    },
  );
  // useAnimatedReaction(
  //   () => {
  //     // console.log(props.containerID);
  //     // console.log(props.positions.value[props.containerID]);
  //     return props.positions.value[props.containerID][props.id];
  //   },
  //   newOrder => {
  //     containerStartYMapping.value = handleContainerStartYMapping();
  //     const newPosition = getPosition(
  //       newOrder,
  //       props.containerWidth,
  //       props.itemHeight,
  //       props.numOfColumns,
  //       containerStartYMapping,
  //       props.containerID,
  //     );
  //     translateX.value = withTiming(newPosition.x, animationConfig);
  //     translateY.value = withTiming(newPosition.y, animationConfig);
  //     contentHeight.value =
  //       (Object.keys(props.positions.value[props.containerID]).length /
  //         props.numOfColumns) *
  //       props.itemHeight;
  //   },
  // );
  let onGestureEvent = useAnimatedGestureHandler({
    onStart: (_, ctx) => {
      const containerStartY = handleGetContainerStartY(
        positionsWithOrder,
        props.id,
        props.container ? 'container' : 'child',
      );
      longPressTimer.value = setTimeout(() => {
        isGestureActive.value = true;
        shouldMoveItem.value = true;
      }, 500);
      ctx.x = translateX.value;
      ctx.y = translateY.value;
      ctx.fromIndex = props.container
        ? props.positionsWithOrder.value[props.id].order
        : props.positionsWithOrder.value[props.containerID].children[props.id]
            .order;
    },
    onActive: ({translationX, translationY}, ctx) => {
      if (shouldMoveItem.value) {
        translateX.value = ctx.x + translationX;
        translateY.value = ctx.y + translationY;

        // handle re-order items
        let oldOrder = props.container
          ? props.positionsWithOrder.value[props.id].order
          : props.positionsWithOrder.value[props.containerID].children[props.id]
              .order;
        let newOrder = getOrder(
          translateX.value,
          translateY.value,
          props.containerWidth,
          props.itemHeight,
          props.numOfColumns,
          props.positionsWithOrder,
          props.id,
          props.container ? 'container' : 'child',
        );
        ctx.newOrder = newOrder;
        if (
          oldOrder !== newOrder.order ||
          props.containerID !== newOrder.containerID
        ) {
          // const itemToSwap =
          //   props.positions.value[newOrder.containerID][idToSwap];

          let swapIDs = {from: null, to: null};
          let fromOrder = null;
          if (props.container) {
            fromOrder = props.positionsWithOrder.value[props.id].order;
            let toID = Object.keys(props.positionsWithOrder.value).find(
              key =>
                props.positionsWithOrder.value[key].order === newOrder.order,
            );
            swapIDs = {from: props.id, to: toID};
          } else if (props.child) {
            fromOrder =
              props.positionsWithOrder.value[props.containerID].children[
                props.id
              ].order;
            let toID = Object.keys(
              props.positionsWithOrder.value[props.containerID].children,
            ).find(
              key =>
                props.positionsWithOrder.value[props.containerID].children[key]
                  .order === newOrder.order,
            );
            swapIDs = {from: props.id, to: toID};
          }

          let positionsWithOrderCopy = {...props.positionsWithOrder.value};
          if (
            (props.containerID === newOrder.containerID || props.container) &&
            swapIDs.from &&
            swapIDs.to
          ) {
            // console.log(swapIDs);
            // handle swapping actual data
            if (props.child) {
              positionsWithOrderCopy[props.containerID].children[
                swapIDs.from
              ].order = newOrder.order;
              positionsWithOrderCopy[newOrder.containerID].children[
                swapIDs.to
              ].order = oldOrder;
              // let fromItemContainer = dataCopy[oldItemContainerIndex];
              // let oldItemCopy = fromItemContainer.children[oldOrder];
              // fromItemContainer.children.splice(oldOrder, 1);
              // fromItemContainer.children.splice(newOrder.order, 0, oldItemCopy);
            } else if (props.container) {
              positionsWithOrderCopy[swapIDs.from].order = newOrder.order;
              positionsWithOrderCopy[swapIDs.to].order = oldOrder;
              // let tmp = [...dataCopy];
              // let oldItemCopy = dataCopy[oldOrder];
              // dataCopy.splice(oldOrder, 1);
              // dataCopy.splice(newOrder.order, 0, oldItemCopy);
            }
          } else {
            //TODO: handling drag and drop between containers
            // newPositions[newOrder.containerID][props.id] = newOrder.order;
            // console.log(newPositions);
            // let fromContainer = dataCopy[oldItemContainerIndex];
            // let fromItemCopy = fromContainer.children.splice(oldOrder, 1)[0];
            // // console.log(fromContainer);
            // console.log(fromItemCopy);
            // if (fromItemCopy) {
            //   fromItem = fromItemCopy;
            // }
            // newPositions[newOrder.containerID][props.id] = oldOrder;
            // delete newPositions[props.containerID][props.id];
          }
          props.positionsWithOrder.value = {...positionsWithOrderCopy};
        }

        // handling scrolling the ScrollView
        const containerStartY = handleGetContainerStartY(
          positionsWithOrder,
          props.id,
          props.container ? 'container' : 'child',
        );
        const lowerBound = scrollY.value;
        const upperBound = lowerBound + containerHeight - props.itemHeight;
        const maxScroll = contentHeight - containerHeight;
        const leftToScrollDown = maxScroll - scrollY.value;
        let actualTranslateY = props.container
          ? translateY.value
          : translateY.value + containerStartY + props.titleHeight;
        if (actualTranslateY < lowerBound) {
          const diff = Math.min(lowerBound - actualTranslateY, lowerBound);
          scrollY.value -= diff;

          scrollViewRef?.current.scrollTo({
            y: scrollY.value,
            animated: false,
          });
          ctx.y -= diff;
          translateY.value = ctx.y + translationY;
        }

        if (actualTranslateY > upperBound) {
          const diff = Math.min(
            actualTranslateY - upperBound,
            leftToScrollDown,
          );
          // console.log(actualTranslateY, upperBound, leftToScrollDown);
          scrollY.value += diff;
          scrollViewRef?.current.scrollTo({
            y: scrollY.value,
            animated: false,
          });
          ctx.y += diff;
          translateY.value = ctx.y + translationY;
        }
      } else {
        //TODO
        // let scrollTo = scrollY.value + translationY;
        // clearTimeout(longPressTimer.value);
        // props.scrollViewRef?.current.scrollTo({
        //   x: 0,
        //   y: scrollTo,
        //   animated: false,
        // });
      }
      if (Math.abs(translationY - translateY.value) > 50) {
        clearTimeout(longPressTimer.value);
        // isGestureActive.value = true;
        // shouldMoveItem.value = true;
      }
    },
    onEnd: (_, ctx) => {
      let newOrder = props.container
        ? props.positionsWithOrder.value[props.id].order
        : props.positionsWithOrder.value[props.containerID].children[props.id]
            .order;
      const containerStartY = handleGetContainerStartY(
        positionsWithOrder,
        props.id,
        props.container ? 'container' : 'child',
      );
      const destination = getPosition(
        newOrder,
        props.containerWidth,
        props.itemHeight,
        props.numOfColumns,
        containerStartY,
      );

      translateX.value = withTiming(destination.x, animationConfig, () => {
        isGestureActive.value = false;
      });
      translateY.value = withTiming(destination.y, animationConfig);

      if (props.onReorder && shouldMoveItem.value) {
        let dataCopy = [...props.data.value];
        // handle reordering actual data
        if (props.child) {
          const parentContainer = dataCopy.find(item =>
            item.children.find(child => child.id === props.id),
          );
          parentContainer.children.splice(
            ctx.newOrder.order,
            0,
            parentContainer.children.splice(ctx.fromIndex, 1)[0],
          );
        } else if (props.container) {
          dataCopy.splice(
            ctx.newOrder.order,
            0,
            dataCopy.splice(ctx.fromIndex, 1)[0],
          );
        }
        props.data.value = dataCopy;
        props.onReorder(dataCopy);
      }

      shouldMoveItem.value = false;
    },
    onFail: () => {
      clearTimeout(longPressTimer.value);
      longPressTimer.value = null;
      isGestureActive.value = false;
    },
  });

  const style = useAnimatedStyle(() => {
    const zIndex = isGestureActive.value ? 99999 : 0;
    const scale = !props.container && isGestureActive.value ? 1.1 : 1;
    return {
      position: 'absolute',
      top: 0,
      left: 0,
      width: props.containerWidth,
      height: props.itemHeight,
      zIndex,
      transform: [
        {translateX: translateX.value},
        {translateY: translateY.value},
        {scale},
      ],
    };
  });

  return (
    <Animated.View style={style}>
      <PanGestureHandler
        onGestureEvent={onGestureEvent}
        onHandlerStateChange={event => {
          console.log('change');
        }}>
        <Animated.View style={[StyleSheet.absoluteFill]}>
          {props.children}
        </Animated.View>
      </PanGestureHandler>
    </Animated.View>
  );
}
