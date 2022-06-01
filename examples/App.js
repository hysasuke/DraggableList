import React, {useEffect} from 'react';
import {Text, View} from 'react-native';
import {SafeAreaProvider, SafeAreaView} from 'react-native-safe-area-context';
import DraggableList from './DraggableList';
function App() {
  const [data, setData] = React.useState([]);
  useEffect(() => {
    let data = [];
    for (let i = 0; i < 5; i++) {
      let children = [];
      for (let j = 0; j < 5; j++) {
        children.push({
          id: `item-${j}-in-list-${i}`,
          title: `Item-${j}-in-list-${i}`,
          backgroundColor: `rgb(${Math.floor(
            Math.random() * 255,
          )}, ${Math.floor(Math.random() * 255)}, ${Math.floor(
            Math.random() * 255,
          )})`,
          onPress: () => {
            alert(`Item-${j}-in-list-${i}`);
          },
        });
      }
      data.push({
        id: 'container' + i,
        title: 'Container ' + i,
        children: children,
      });
    }

    setData(data);
  }, []);

  return (
    <SafeAreaProvider>
      <SafeAreaView>
        <DraggableList
          itemHeight={60}
          titleHeight={50}
          data={data}
          onReorder={data => {
            // console.log(data);
            setData([...data]);
          }}
          renderTitle={title => {
            return (
              <View>
                <Text>{title.title}</Text>
              </View>
            );
          }}
          renderItem={item => {
            return (
              <View
                style={{
                  padding: 10,
                  margin: 10,

                  backgroundColor: item.backgroundColor,
                }}>
                <Text style={{color: 'white'}}>{item.title}</Text>
              </View>
            );
          }}
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

export default App;
