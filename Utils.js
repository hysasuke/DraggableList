import {Dimensions} from 'react-native';
import {Easing} from 'react-native-reanimated';

const {width} = Dimensions.get('window');
export const MARGIN = 8;
export const COL = 1;
export const SIZE = width / COL - MARGIN;
export const HEIGHT = 50;
export const animationConfig = {
  easing: Easing.inOut(Easing.ease),
  duration: 350,
};

export const getPosition = (
  position,
  containerWidth,
  itemHeight,
  numOfColumns,
  positionsWithOrder,
  type,
) => {
  'worklet';
  let prevContainersHeight = 0;
  for (let key of Object.keys(positionsWithOrder.value)) {
    let item = positionsWithOrder.value[key];
    if (type === 'container') {
      if (item.order < position) {
        prevContainersHeight += item.containerHeight;
      }
    }
  }
  let y =
    type === 'container'
      ? prevContainersHeight
      : Math.floor(position / numOfColumns) * itemHeight;
  return {
    x: position % numOfColumns === 0 ? 0 : containerWidth,
    y: y,
  };
};

export const getOrder = (
  tx,
  ty,
  containerWidth,
  itemHeight,
  numOfColumns,
  positionsWithOrder,
  id,
  type,
) => {
  'worklet';
  let targetContainerID = '';
  let offsetY = 0;
  let maxOffsetY = Number.MIN_SAFE_INTEGER;
  let containerStartY = 0;
  let currentContainer = '';
  if (type === 'container') {
    containerStartY = positionsWithOrder.value[id].offsetY;
    currentContainer = id;
  } else {
    currentContainer = Object.keys(positionsWithOrder.value).find(key =>
      Object.keys(positionsWithOrder.value[key].children).find(
        child => child === id,
      ),
    );
    containerStartY = positionsWithOrder.value[currentContainer].offsetY;
  }
  for (let key of Object.keys(positionsWithOrder.value)) {
    let containerOffsetY = parseFloat(positionsWithOrder.value[key].offsetY);
    if (
      containerStartY + ty > containerOffsetY &&
      containerOffsetY > maxOffsetY
    ) {
      maxOffsetY = containerOffsetY;
      targetContainerID = key;
      if (
        positionsWithOrder.value[key].order <
        positionsWithOrder.value[currentContainer].order
      ) {
        offsetY =
          positionsWithOrder.value[currentContainer].offsetY -
          positionsWithOrder.value[key].offsetY;
      } else if (
        positionsWithOrder.value[key].order >
        positionsWithOrder.value[currentContainer].order
      ) {
        offsetY = containerStartY - positionsWithOrder.value[key].offsetY;
      } else {
        offsetY = 0;
      }
    }
  }
  ty = type === 'child' ? ty + offsetY : ty;
  const x = Math.round(tx / containerWidth) * containerWidth;
  const y = Math.round(ty / itemHeight) * itemHeight;
  const row = Math.max(y, 0) / itemHeight;
  const col = Math.max(x, 0) / containerWidth;

  return {
    containerID: targetContainerID,
    order: Math.min(row * numOfColumns + col),
  };
};
