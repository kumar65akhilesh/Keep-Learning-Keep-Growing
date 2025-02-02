#include<algorithm>
#include<vector>
#include<iterator>
#include<fstream>
#include "Point.h"

using namespace std;

class Chart{

 private:
  vector<Point> pointList;

 public:
  inline  Chart() : pointList(){}
  inline Chart(const Chart& a)  {pointList.assign(a.pointList.begin(), a.pointList.end());}
  inline Chart(const Chart&& src) : pointList(move(src.pointList)){}
  inline Chart(const string& filename){
    ifstream inFile(filename);    
    istream_iterator<Point> ptReader(inFile);
    vector<Point> ptList(ptReader, istream_iterator<Point>());
    pointList.assign(ptList.begin(), ptList.end());              
    inFile.close();       
  }
  friend std::ostream& operator<<(std::ostream& os, const Chart& c){
    copy(c.pointList.begin(), c.pointList.end(),ostream_iterator<Point> (os, "\n"));
    return os;
  }
  friend std::istream& operator>>(std::istream& is, Chart& c){
    
    istream_iterator<Point> pointReader(is);
    copy_n(pointReader, c.pointList.size(), c.pointList.begin());
    return is;
  } 
  Chart& operator=(const Chart& src);
  bool contains(const Point& p) const;
  Chart operator+(const Chart& other) const;
  Chart operator-(const Chart& other) const;
  Chart operator*(const Point& scale) const;
  Chart operator/(const Point& scale) const;
  Chart operator>>(int value) const;
  Chart operator<<(int value) const;
  void analyze(ostream& os, const int scale) const;
};
