import React from 'react';
import * as WebBrowser from 'expo-web-browser';

export const useWarmUpBrowser = () => {
  React.useEffect(() => {
    // Warm up the android browser in the background
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);
};