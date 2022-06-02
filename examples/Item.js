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
export default function Item(props) {
  let {scrollY, positions, scrollViewRef, data} = props;
  let dataCopy = [...data];
  let fromItem = null;
  // handling container position Y mapping
  const handleContainerStartYMapping = () => {
    let containerStartYMapping = {};
    for (let index in Object.keys(positions.value)) {
      if (index == 0) {
        containerStartYMapping[props.container ? 0 : props.titleHeight] =
          Object.keys(positions.value)[index];
      } else {
        const children =
          positions.value[Object.keys(positions.value)[index - 1]];
        const childrenHeight = Object.keys(children).length * props.itemHeight;
        const lastHeight = parseInt(
          Object.keys(containerStartYMapping)[index - 1],
        );
        containerStartYMapping[
          lastHeight + childrenHeight + props.titleHeight
        ] = Object.keys(positions.value)[index];
      }
    }
    return containerStartYMapping;
  };
  const containerStartYMapping = useSharedValue(handleContainerStartYMapping());

  let position = getPosition(
    props.positions.value[props.containerID][props.id],
    props.containerWidth,
    props.itemHeight,
    props.numOfColumns,
    containerStartYMapping,
    props.containerID,
  );

  const translateX = useSharedValue(position.x);
  const translateY = useSharedValue(position.y);
  const inset = useSafeAreaInsets();
  const containerHeight =
    Dimensions.get('window').height - inset.top - inset.bottom;
  const contentHeight = useSharedValue(
    (Object.keys(props.positions.value[props.containerID]).length /
      props.numOfColumns) *
      props.itemHeight,
  );
  const isGestureActive = useSharedValue(false);
  const shouldMoveItem = useSharedValue(false);

  const longPressTimer = useSharedValue(null);

  useAnimatedReaction(
    () => {
      // console.log(props.containerID);
      // console.log(props.positions.value[props.containerID]);
      return props.positions.value[props.containerID][props.id];
    },
    newOrder => {
      containerStartYMapping.value = handleContainerStartYMapping();
      const newPosition = getPosition(
        newOrder,
        props.containerWidth,
        props.itemHeight,
        props.numOfColumns,
        containerStartYMapping,
        props.containerID,
      );
      translateX.value = withTiming(newPosition.x, animationConfig);
      translateY.value = withTiming(newPosition.y, animationConfig);
      contentHeight.value =
        (Object.keys(props.positions.value[props.containerID]).length /
          props.numOfColumns) *
        props.itemHeight;
    },
  );
  let onGestureEvent = useAnimatedGestureHandler({
    onStart: (_, ctx) => {
      longPressTimer.value = setTimeout(() => {
        isGestureActive.value = true;
        shouldMoveItem.value = true;
      }, 500);
      ctx.x = translateX.value;
      ctx.y = translateY.value;
    },
    onActive: ({translationX, translationY}, ctx) => {
      if (shouldMoveItem.value) {
        translateX.value = ctx.x + translationX;
        translateY.value = ctx.y + translationY;

        // handle re-order items
        let oldOrder = props.positions.value[props.containerID][props.id];
        let newOrder = getOrder(
          translateX.value,
          translateY.value,
          props.containerWidth,
          props.itemHeight,
          props.numOfColumns,
          containerStartYMapping.value,
          props.containerID,
        );
        if (
          oldOrder !== newOrder.order ||
          props.containerID !== newOrder.containerID
        ) {
          const idToSwap =
            props.positions.value[newOrder.containerID] &&
            Object.keys(props.positions.value[newOrder.containerID]).find(
              key =>
                props.positions.value[newOrder.containerID][key] ===
                newOrder.order,
            );

          const oldItemContainerIndex = Object.keys(
            props.positions.value,
          ).indexOf(props.containerID);
          const swapItemContainerIndex = Object.keys(
            props.positions.value,
          ).indexOf(newOrder.containerID);
          // const itemToSwap =
          //   props.positions.value[newOrder.containerID][idToSwap];
          let newPositions = {
            ...props.positions.value,
          };

          if (props.containerID === newOrder.containerID && idToSwap) {
            newPositions[props.containerID][props.id] = newOrder.order;
            newPositions[newOrder.containerID][idToSwap] = oldOrder;

            // handle swapping actual data
            if (props.child) {
              let fromItemContainer = dataCopy[oldItemContainerIndex];
              let oldItemCopy = fromItemContainer.children[oldOrder];
              fromItemContainer.children.splice(oldOrder, 1);
              fromItemContainer.children.splice(newOrder.order, 0, oldItemCopy);
            } else if (props.container) {
              let tmp = [...dataCopy];
              let oldItemCopy = dataCopy[oldOrder];
              dataCopy.splice(oldOrder, 1);
              dataCopy.splice(newOrder.order, 0, oldItemCopy);
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
          props.positions.value = {...newPositions};
        }

        // handling scrolling the ScrollView
        const lowerBound = scrollY.value;
        const upperBound = lowerBound + containerHeight - props.itemHeight;
        const maxScroll = contentHeight.value - containerHeight;
        const leftToScrollDown = maxScroll - scrollY.value;
        if (translateY.value < lowerBound) {
          const diff = Math.min(lowerBound - translateY.value, lowerBound);
          scrollY.value -= diff;

          scrollViewRef?.current.scrollTo({
            y: scrollY.value,
            animated: false,
          });
          ctx.y -= diff;
          translateY.value = ctx.y + translationY;
        }
        // console.log(actualTranslationY, upperBound, lowerBound);
        if (translateY.value > upperBound) {
          const diff = Math.min(
            translateY.value - upperBound,
            leftToScrollDown,
          );
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
    onEnd: () => {
      shouldMoveItem.value = false;
      const destination = getPosition(
        props.positions.value[props.containerID][props.id],
        props.containerWidth,
        props.itemHeight,
        props.numOfColumns,
        containerStartYMapping,
        props.containerID,
      );

      translateX.value = withTiming(destination.x, animationConfig, () => {
        isGestureActive.value = false;
      });
      translateY.value = withTiming(destination.y, animationConfig);
      if (props.onReorder) {
        props.onReorder(dataCopy);
      }
    },
    onFail: () => {
      clearTimeout(longPressTimer.value);
      longPressTimer.value = null;
      isGestureActive.value = false;
    },
  });

  const style = useAnimatedStyle(() => {
    const zIndex = isGestureActive.value ? 100 : 0;
    const scale = !props.container && isGestureActive.value ? 1.1 : 1;
    return {
      position: 'absolute',
      top: 0,
      left: 0,
      width: props.containerWidth,
      height: contentHeight.value,
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
