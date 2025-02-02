#include "kumara2_ChartMaker.h"

using namespace std;

//calls the chart overloaded - operator
void ChartMaker::subPoints() {
  load2(); 
  c3 = c3 - c2;
  return;
}
//decreses the scale of the graph
void ChartMaker::decreaseScale() {
  
  cout << "Enter values to scale x & y cordinates: ";
  int x, y;
  cin >> x >> y;
  c3 = c3 / Point(x, y);
  return;
}
//increase the scale of graph
void ChartMaker::increaseScale() {
  
  cout << "Enter values to scale x & y cordinates: ";
  int x, y;
  cin >> x >> y;
  c3 = c3 * Point(x, y);
  return;
}
//Shifts the point to the left
void ChartMaker::shiftLeft() {
  cout << "Enter positions to shift: ";
  int pos;
  cin >> pos;
  c3 = c3 << pos;
  return;
}
//shifts the point to the right
void ChartMaker::shiftRight() {
  cout << "Enter positions to shift: ";
  int pos;
  cin >> pos;
  c3 = c3 >> pos;  
  return;
}
//prints the histogram
void ChartMaker::printHistogram() {
  ofstream outFile("ex_points.txt");
  Chart x(c3);
  int scale;
  cout << "Enter the scaling factor(must be an integer) : ";
  cin >> scale;
  x.analyze(cout, scale);
  return;
}
//save the file to a user specified file name
void ChartMaker::save(){
  cout << "Enter the file name: ";
  string filename;
  cin >> filename;
  ofstream outFile(filename);
  outFile << c3;
  outFile.close();
  return;
}
//generates help menu for the users
void ChartMaker::help(){
  cout << "All commands are single characters." << endl;
  cout << "Valid commands are: " << endl;
  cout << "l: Load data from file as current set of points" << endl;
  cout << "+: Add data from another to current points" << endl;
  cout << "-: Subtract data from another file from current points" << endl;
  cout << "*: Scale current points by given pair of values" << endl;
  cout << "/: Scale current points by given pair of values" << endl;
  cout << "?: Print histogram point distribution" << endl;
  cout << "<: Shift points to left by a given pair of values" << endl;
  cout << ">: Shift point to right by a given pairr of values" << endl;
  cout << "s: Save the current set of points to a given file" << endl;
  cout << "p: Print current set of points on screen" << endl;
  cout << "h: Print this message" << endl;
  cout << "q: Quit" << endl;
  return;
}
//add to charts
void ChartMaker::addPoints() {
  load2();  
  c3 = (c3 + c2);  
  return;
}
//stops the program
void ChartMaker:: quit() {
  cout << "exit successfull" << endl;
  exit (0);
  return;
}
//print the points in the chart
void ChartMaker:: printPoints(Chart c) {
  cout << c3;
  return;
}
//load the second chart for addition and subtraction of charts
void ChartMaker::load2() {
  cout << "Enter path to file: ";
  string filepath;
  cin >> filepath;
  Chart x(filepath);
  c2 = x;
  return;
}
//loads a file
void ChartMaker::load() {
  cout << "Enter path to file: ";
  string filepath;
  cin >> filepath;
  Chart x(filepath);
  c = x;
  c3 =c;
  return;
}
//method to run the program
int ChartMaker::run() {
  while(true){
    cout << "Enter command (h for help): " ;
    char choice;
    cin >> choice;
    switch (choice){
    case 'l': load();
      break;
    case 'h': help();
      break;
    case '+': addPoints();
      break;
    case '-': subPoints();
      break;
    case '*': increaseScale();
      break;
    case '/': decreaseScale();
      break;
    case '?': printHistogram();
      break;
    case '>': shiftRight();
      break;
    case '<': shiftLeft();
      break;
    case 's': save();
      break;
    case 'p': printPoints(c);
      break;
    case 'q': quit();
      break;
    default: cout << "No such option available. Please try again ";
      cin >> choice;
    }
  }
  return 0;
}


