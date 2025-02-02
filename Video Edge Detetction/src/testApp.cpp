#include "testApp.h"

//--------------------------------------------------------------
void testApp::setup(){

	camWidth 		= 320;	// try to grab at this size.
	camHeight 		= 240;

	vidGrabber.setVerbose(true);
	vidGrabber.initGrabber(camWidth,camHeight);

	videoInverted 	= new unsigned char[camWidth*camHeight*3];
	videoTexture.allocate(camWidth,camHeight, GL_RGB);
}


//--------------------------------------------------------------
void testApp::update(){

	ofBackground(100,100,100);

	vidGrabber.update();

	if (vidGrabber.isFrameNew()){
		int totalPixels = camWidth*camHeight*3;
		unsigned char * pixels = vidGrabber.getPixels();
		int sobel[3][3] = {{1, 0, -1}, {2, 0, -2}, {1, 0, -1}};
		int sobel_x[3][3] = {{1, 2, 1}, {0, 0, 0}, {-1, -2, -1}};
		int c = 0;

        for(int i = 1; i < camHeight - 1; i++){
        for(int j = 1; j < camWidth - 1; j++){
        int magnitude_y[3][3];
        int magnitude_x[3][3];


        magnitude_y[0][0] = sobel[0][0] * getAverage(pixels, i-1, j-1);
        magnitude_y[0][1] = sobel[0][1] * getAverage(pixels, i-1, j) ;
        magnitude_y[0][2] = sobel[0][2] * getAverage(pixels, i-1, j+1) ;
        magnitude_y[1][0] = sobel[1][0] * getAverage(pixels, i, j-1) ;
        magnitude_y[1][1] = sobel[1][1] * getAverage(pixels, i, j) ;
        magnitude_y[1][2] = sobel[1][2] * getAverage(pixels, i, j+1) ;
        magnitude_y[2][0] = sobel[2][0] * getAverage(pixels, i+1, j-1) ;
        magnitude_y[2][1] = sobel[2][1] * getAverage(pixels, i+1, j) ;
        magnitude_y[2][2] = sobel[2][2] * getAverage(pixels, i+1, j+1) ;

        magnitude_x[0][0] = sobel_x[0][0] * getAverage(pixels, i-1, j-1) ;
        magnitude_x[0][1] = sobel_x[0][1] * getAverage(pixels, i-1, j) ;
        magnitude_x[0][2] = sobel_x[0][2] * getAverage(pixels, i-1, j+1) ;
        magnitude_x[1][0] = sobel_x[1][0] * getAverage(pixels, i, j-1) ;
        magnitude_x[1][1] = sobel_x[1][1] * getAverage(pixels, i ,j) ;
        magnitude_x[1][2] = sobel_x[1][2] * getAverage(pixels, i, j+1),
        magnitude_x[2][0] = sobel_x[2][0] * getAverage(pixels, i+1, j-1) ;
        magnitude_x[2][1] = sobel_x[2][1] * getAverage(pixels, i+1, j) ;
        magnitude_x[2][2] = sobel_x[2][2] * getAverage(pixels, i+1, j+1) ;

        double magnitude = sqrt(pow(determinant(magnitude_x),2) + pow(determinant(magnitude_y),2));

        videoInverted[(i*camWidth+ j)*3+1] =  magnitude;

        videoInverted[(i*(camWidth)+j)*3] = magnitude;
        videoInverted[(i*(camWidth)+j)*3+2] = magnitude; //camHei*camWidth - camWidth + 3*camWidth -6 +2

        }
        }

        videoTexture.loadData(videoInverted, camWidth,camHeight, GL_RGB);





	}

}

double testApp::determinant(int m[3][3])
{
int dim = 3;

double det = 0.0;
	    for (int i = 0; i < dim; i++)
	    {
	        double a = 1.0, b = 1.0;
	        for (int row = 0; row < dim; row++)
	        {
	            det += m[i][row];
	        }

	    }
    return det;
}

//--------------------------------------------------------------

int testApp::getAverage(unsigned char * pixels, int i, int j){
int average ;
average = (pixels[((i*camWidth+j))*3] + pixels[((i*camWidth+j)*3) + 1] + pixels[((i*camWidth+j)*3) + 2])/3;
return average;
}

void testApp::draw(){
	ofSetHexColor(0xffffff);
	vidGrabber.draw(20,20);
	videoTexture.draw(20+camWidth,20,camWidth,camHeight);
}


//--------------------------------------------------------------
void testApp::keyPressed  (int key){

	if (key == 's' || key == 'S'){
		vidGrabber.videoSettings();
	}


}

//--------------------------------------------------------------
void testApp::keyReleased(int key){

}

//--------------------------------------------------------------
void testApp::mouseMoved(int x, int y ){

}

//--------------------------------------------------------------
void testApp::mouseDragged(int x, int y, int button){

}

//--------------------------------------------------------------
void testApp::mousePressed(int x, int y, int button){

}

//--------------------------------------------------------------
void testApp::mouseReleased(int x, int y, int button){

}

//--------------------------------------------------------------
void testApp::windowResized(int w, int h){

}

//--------------------------------------------------------------
void testApp::gotMessage(ofMessage msg){

}

//--------------------------------------------------------------
void testApp::dragEvent(ofDragInfo dragInfo){

}
