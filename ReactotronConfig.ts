import AsyncStorage from '@react-native-async-storage/async-storage';
import Reactotron from 'reactotron-react-native';

Reactotron.setAsyncStorageHandler(AsyncStorage)
  .configure({
    name: 'TanLabs English for SE',
  })
  .useReactNative({
    networking: {
      ignoreUrls: /symbolicate|logs|generate_204/,
    },
  })
  .connect();
