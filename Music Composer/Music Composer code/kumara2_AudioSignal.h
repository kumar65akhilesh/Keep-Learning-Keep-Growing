
#include<vector>
#include "RIFF.h"

using namespace std;

class AudioSignal{
 private:
  int sampleRate;
  short bitsPerSample;
  vector<Sample> wave;
 public:
  AudioSignal(const int sampleRate = 22050 , const short bitsPerSample = 16 );
  AudioSignal(RIFFReader& inputWaveFile);
  AudioSignal(const AudioSignal& other);
  AudioSignal(const AudioSignal&& other);
  AudioSignal& operator=(const AudioSignal& src); 
  AudioSignal(const int freq, const int lenInMills, const int amplitude,
	      const int sampleRate = 22050, const short bitsPerSample = 16,
	      const bool decay = true); 
  AudioSignal operator+(const AudioSignal& other) const;
  AudioSignal& operator&(const AudioSignal& other);
  AudioSignal& operator*(const double factor);
  AudioSignal operator>>(long timeInMillis) const;
  AudioSignal operator<<(long timeInMillis) const;
  long duration() const;
  void write(const std::string& fileName) const throw (std::exception);
  void changeDurationTo(const int timeInMillis);
};
