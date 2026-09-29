import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import type { ReactElement } from 'react';

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#fff',
		alignItems: 'center',
		justifyContent: 'center',
	},
});

export const App = (): ReactElement => (
	<View style={styles.container}>
		<Text>Hello, world</Text>
		<StatusBar style="auto" />
	</View>
);
