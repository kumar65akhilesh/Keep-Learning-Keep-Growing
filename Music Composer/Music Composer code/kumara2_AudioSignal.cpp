#include<iostream>
#include<algorithm>
#include<cmath>
#include<functional>
#include "kumara2_AudioSignal.h"

using namespace std;
const double pi = 3.14159;

//constructor

AudioSignal::AudioSignal(const int sampleRate , const short bitsPerSample ){
  this->sampleRate = sampleRate;
  this->bitsPerSample = bitsPerSample;
}

//constructor

AudioSignal::AudioSignal(RIFFReader& inputWaveFile){
  Sample data;
  sampleRate = inputWaveFile.getSampleRate();
  bitsPerSample = inputWaveFile.getBitsPerSample();
  while ((inputWaveFile >> data)) {
    wave.push_back(data);
  }
}

//copy constructor

AudioSignal::AudioSignal(const AudioSignal& other): sampleRate(other.sampleRate), bitsPerSample(other.bitsPerSample){
  wave.assign(other.wave.begin(), other.wave.end());
}

//move constructor

AudioSignal::AudioSignal(const AudioSignal&& other): sampleRate(move(other.sampleRate)), bitsPerSample(move(other.bitsPerSample)), wave(move(other.wave)) { }

//oveloaded = 

AudioSignal& AudioSignal::operator=(const AudioSignal& src) {
  sampleRate = src.sampleRate;
  bitsPerSample = src.bitsPerSample;
  wave.assign(src.wave.begin(), src.wave.end());
  return *this;
}

//overloaded *

AudioSignal& AudioSignal::operator*(const double factor){  
  transform(wave.begin(), wave.end(), wave.begin(), [&factor](Sample s){return s*factor;});
  return *this;
}

//overloaded >>

AudioSignal AudioSignal::operator>>(long timeInMillis) const{
  unsigned int num = sampleRate*timeInMillis/1000;
  AudioSignal music(*this);
  music.wave.insert(music.wave.begin(), num, 0);
  return music;
}

//overloaded <<

AudioSignal AudioSignal::operator<<(long timeInMillis) const{
  int num = sampleRate*timeInMillis/1000;
  AudioSignal music(*this);
  music.wave.erase(music.wave.begin(), music.wave.begin()+num);
  return music;
}

//Returns the duration of the AudioSignal in seconds

long AudioSignal::duration() const{
  long num = wave.size();
  return num/sampleRate;
}

//Changes the duration of the AudioSignal by specified milli seconds

void AudioSignal::changeDurationTo(const int timeInMillis){
  unsigned  int thisLen = wave.size();
  vector<Sample> dupe(wave);
  unsigned int numOfSamples = timeInMillis*sampleRate/1000;
  if(thisLen > numOfSamples) {
    wave.erase(wave.begin()+numOfSamples, wave.end()); // truncate if larger in size
  } else {
    while(wave.size() < numOfSamples) {
      copy(dupe.begin(), dupe.end(), back_inserter(wave)); // copy if smaller in size
    };
    wave.erase(wave.begin()+numOfSamples, wave.end());
  }
}

//The bad guy of this project. This creates the wave Sample based on sin wave formula

AudioSignal::AudioSignal(const int freq, const int lenInMills, const int amplitude,
			 const int sampleRate , const short bitsPerSample,
			 const bool decay ){
  this->sampleRate = sampleRate;
  this->bitsPerSample = bitsPerSample;
  for(int j = 0; j < lenInMills * sampleRate /1000; j++){
    double t = ((double) j * ((double) lenInMills/1000)) / ((double) lenInMills*sampleRate/1000);
    double height = amplitude * (exp((double) -t/ (sampleRate*lenInMills/1000)/ 0.5));   
    Sample s = height * sin(2 * pi * freq * t);
    wave.push_back(s);
  }
}

//concatenates two AudioSignal

AudioSignal& AudioSignal::operator&(const AudioSignal& other){
  copy(other.wave.begin(), other.wave.end(), back_inserter(wave));
  return *this;
}

//OverLoaded +

AudioSignal AudioSignal::operator+(const AudioSignal& other) const{
  AudioSignal supSignal(*this);
  int len1 = wave.size();
  int len2 = other.wave.size();
  if(len1 < len2) {
    transform(wave.begin(), wave.end(), other.wave.begin(), supSignal.wave.begin(), plus<int>());
    copy(other.wave.begin()+len1 , other.wave.end(), back_inserter(supSignal.wave));
  } else {
    transform(other.wave.begin(), other.wave.end(), wave.begin(), supSignal.wave.begin(), plus<Sample>());
    copy(wave.begin()+len2, wave.end(), back_inserter(supSignal.wave));
  }
  return supSignal;
}

void AudioSignal::write(const std::string& fileName) const throw (std::exception){
  RIFFWriter wavFile(fileName, 22050, 16);
  for(unsigned int i = 0; i < wave.size(); i++){
    wavFile <<  wave[i];
  }
}
