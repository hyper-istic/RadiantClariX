
import React from 'react';
import styled from 'styled-components/native';

const FooterWrapper = styled.View`
	position: absolute;
	bottom: 0;
	left: 0;
	right: 0;
	background: #181818;
	padding: 24px 0px;
	flex-direction: row;
	justify-content: center;
	align-items: center;
	z-index: 100;
	margin-bottom: 20px;
`;

	// Removed leftover CSS code

const ButtonLabel = styled.Text`
	color: #fff;
	font-size: 16px;
	font-weight: 600;
	letter-spacing: 1px;
`;


const Button = styled.TouchableOpacity`
	flex-direction: row;
	align-items: center;
	justify-content: center;
	padding: 9px 12px;
	margin: 0 4px;
	height: 49.5px;
	min-width: 154px;
	border-radius: 22px;
	margin-bottom: 10px;
`;

const UploadButton = styled(Button)`
	background: #007bff;
`;

const Footer = ({ onUpload, onCamera }) => {
	return (
		<FooterWrapper>
			<UploadButton onPress={onUpload}>
				{/* Example SVG icon for Upload */}
				<ButtonLabel>Upload</ButtonLabel>
			</UploadButton>
					<Button onPress={onCamera} style={{backgroundColor: '#FF2849'}}>
						{/* Example SVG icon for Camera */}
						<ButtonLabel>Take Image</ButtonLabel>
					</Button>
		</FooterWrapper>
	);
};


export default Footer;
