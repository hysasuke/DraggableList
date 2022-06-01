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
  containerStartYMapping,
  containerID,
) => {
  'worklet';
  let offsetY = 0;
  let keys = Object.keys(containerStartYMapping.value);
  for (let key of keys) {
    if (containerStartYMapping.value[key] == containerID) {
      offsetY = parseInt(key);
      break;
    }
  }
  let y = Math.floor(position / numOfColumns) * itemHeight;

  // console.log(y + offsetY);
  return {
    x: position % numOfColumns === 0 ? 0 : containerWidth,
    y: y,
    yInPage: y + offsetY,
  };
};

export const getOrder = (
  tx,
  ty,
  containerWidth,
  itemHeight,
  numOfColumns,
  containerStartYMapping,
  containerID,
) => {
  'worklet';
  let targetContainerID = '';
  let startY = parseInt(
    Object.keys(containerStartYMapping).find(
      key => containerStartYMapping[key] === containerID,
    ),
  );
  for (let key of Object.keys(containerStartYMapping)) {
    let index = Object.keys(containerStartYMapping).indexOf(key);
    if (startY + ty > parseFloat(key)) {
      targetContainerID = containerStartYMapping[key];
    }
  }
  const x = Math.round(tx / containerWidth) * containerWidth;
  const y = Math.round(ty / itemHeight) * itemHeight;
  const row = Math.max(y, 0) / itemHeight;
  const col = Math.max(x, 0) / containerWidth;
  return {
    containerID: targetContainerID,
    order: Math.min(row * numOfColumns + col),
  };
};
