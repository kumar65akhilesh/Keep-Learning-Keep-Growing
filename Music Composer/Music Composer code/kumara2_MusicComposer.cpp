#include<iostream>
#include "kumara2_MusicComposer.h"
#include <string>
#include<iterator>
#include<algorithm>

bool fileOn = false;

//default constructor
MusicComposer::MusicComposer(){  
  music = AudioSignal(22050, 16);
  note = NoteMaker(120, 15,4, 15000 );
  fileOn = true;
}

// Returns the overall music after the various operations

const AudioSignal& MusicComposer::getMusic(){
  return music;
}

//This function adds all the tracks and returns a single track

void MusicComposer::addAll(){
  music = getMusic();
  multiTrack.clear();
  multiTrack.push_back(music);  
}

//This function changes the duration of the specified track to largest duration track in the list till that moment

void MusicComposer::longDuration(string ent){
  long maxDuration = 0;
  string num = ent.substr(2);
  int digit = stoi(num);
  for(unsigned int i = 0; i < multiTrack.size(); i++) {
    if(maxDuration < multiTrack[i].duration()){
      maxDuration = multiTrack[i].duration();
    }
  }
  AudioSignal track = multiTrack.at(digit-1);
  track.changeDurationTo(maxDuration*1000);
  multiTrack[digit-1] = track;
  AudioSignal modifiedMusic;
  for(unsigned int i = 0; i < multiTrack.size(); i++) {
    modifiedMusic = modifiedMusic & multiTrack[i];
  }  
  music = modifiedMusic;    
}

//This function changes the duration of the specified track to the smallest duration track in the list  till that moment.

void MusicComposer::smallDuration(string ent){
  long minDuration = multiTrack[0].duration();
  string num = ent.substr(2);
  int digit = stoi(num);
  for(unsigned int i = 0; i < multiTrack.size(); i++) {
    if(minDuration > multiTrack[i].duration()){
      minDuration = multiTrack[i].duration();
    }
  }
  AudioSignal track = multiTrack.at(digit-1);
  track.changeDurationTo(minDuration*1000);
  multiTrack[digit-1] = track;
  AudioSignal modifiedMusic;
  for(unsigned int i = 0; i < multiTrack.size(); i++) {
    modifiedMusic = modifiedMusic & multiTrack[i];
  }  
  music = modifiedMusic;
}

//Decreases the volume, and shifts the track by specified value

void MusicComposer::echo(string ent){
  string num = ent.substr(2);
  int digit = stoi(num);
  AudioSignal track = multiTrack.at(multiTrack.size()-1);
  multiTrack.pop_back();
  track = track << digit;
  track * 0.25;
  multiTrack.push_back(track);
  AudioSignal modifiedMusic;
  for(unsigned int i = 0; i < multiTrack.size(); i++) {
    modifiedMusic = modifiedMusic & multiTrack[i];
  }
  music = modifiedMusic;
}

//Adds the specified track number to the current position

void MusicComposer::changeTrack(string ent){
  string num = ent.substr(2);
  int digit = stoi(num);
  AudioSignal audio = multiTrack.at(digit-1);
  multiTrack.push_back(audio);
  music & audio;
}
//Adds the specified wav file in the track list

AudioSignal& MusicComposer::loadFile(string filename){
  string fileN = filename.substr(2);
  RIFFReader input(fileN);
  AudioSignal track = AudioSignal(input);
  multiTrack.push_back(track);
  fileOn = true;
  return (music & track);
}

//This function operates on the multile tracks present in the list

AudioSignal& MusicComposer::operator()(const std::string& ent){
  string word = ent;
  char first = word.at(0);

  if(first == '*') {
    char second = word.at(1);
    switch(second) {
    case 't': changeTrack(ent);
      break;
    case 'l': return loadFile(ent);
      break;
    case 'e': echo(ent);
      break;
    case '~': smallDuration(ent);
      break;
    case '=': longDuration(ent);
      break;
    case '.': addAll();
      break;
    default : cout << "Oops!!!! There was an invalid character " << endl;
    }
  } else {
    music = readNotes(ent);
  }

return music;
}

//This function reads the valid notes (in capital letters) from the console

AudioSignal& MusicComposer::readNotes(string ent){
  NoteMaker note;
  AudioSignal audio;
  audio = note(ent);
  if(fileOn == true) {
    fileOn = false;
    multiTrack.push_back(audio);
  } else {
    AudioSignal track = multiTrack.at(multiTrack.size()-1);
    audio = track & audio;
    multiTrack.pop_back();
    multiTrack.push_back(audio);
  }
  AudioSignal musicValue;
  for(unsigned int i = 0; i < multiTrack.size(); i++){
    musicValue = musicValue & multiTrack[i];
  }
  music = musicValue;
  return music;
}

// The main function provided by you

int main(int argc, char *argv[]) {
  MusicComposer mc;
  std::istream_iterator<std::string> noteStream(std::cin), eof;
  mc = std::for_each(noteStream, eof, mc);
  mc.getMusic().write(argv[1]);
  return 0;
}
