#include<iostream>
#include<vector>
#include "NoteMaker.h"

class MusicComposer{
 
 private: 
  AudioSignal music;
  bool fileOn;
  NoteMaker note;
  vector<AudioSignal> multiTrack;

 public:
  MusicComposer();
  AudioSignal& loadFile(string filename);
  const AudioSignal& getMusic();
  AudioSignal& operator()(const std::string& ent);
  void addAll();
  void longDuration(string ent);
  void changeEcho(string ent);
  AudioSignal& readNotes(string ent);
  void smallDuration(string ent);
  void echo(string ent);
  void changeTrack(string ent);
};
