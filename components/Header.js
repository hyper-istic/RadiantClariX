
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const Header = () => (
  <View style={styles.headerContainer}>
    <Text style={styles.headerText}>X-Ray Analyzer</Text>
  </View>
);

const styles = StyleSheet.create({
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    paddingTop: 24,
    paddingBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    marginTop: -21,
  },
  headerText: {
    color: '#111',
    fontSize: 22,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginTop: 50,
  },
});

export default Header;
