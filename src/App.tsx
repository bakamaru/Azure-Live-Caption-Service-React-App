import React, { useEffect, useState } from 'react';
import logo from './logo.svg';
import './App.css';
import * as SpeechSDK from "microsoft-cognitiveservices-speech-sdk"
import axios from 'axios';
//declare const SpeechSDK: any;

export type AzureToken = { authorizationToken: string; region: string; }
export type OnTextRecognised = (text: string) => void;

export class AzureCognitiveSpeech {

  private _tokenAuthApiPath: string;
  private _callback: OnTextRecognised;

  constructor(tokenAuthApiPath: string = "/api/createAzureTokenRequest") {
    this._tokenAuthApiPath = tokenAuthApiPath;
    this._callback = (s) => { };
  }

  public onTextRecognised(callback: OnTextRecognised) {
    this._callback = callback;
  }
  private recognizer: any;
  public async streamSpeechFromBrowser() {
    const speechConfig = await this.getConfig();
    const audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();
    this.recognizer = new SpeechSDK.SpeechRecognizer(speechConfig, audioConfig);

    this.recognizer.recognized = async (_: any, speechResult: any) => {
      console.log(_, speechResult)
      const text = speechResult.privResult.privText ?? "";
      this._callback(text);
    };

    this.recognizer.startContinuousRecognitionAsync(
      function () { },
      function (error: any) { console.log(error); }
    );
  }
  public async stopContinuousRecognitionAsync() {

    this.recognizer.stopContinuousRecognitionAsync()
  }

  private async getConfig() {
    const azureToken = await this.getToken();

    const speechConfig = SpeechSDK.SpeechConfig.fromAuthorizationToken(
      azureToken,
      "eastus"
    );
    console.log("speechConfig", speechConfig)
    speechConfig.speechRecognitionLanguage = "en-US";
    return speechConfig;
  }

  private async getToken(): Promise<string> {
    // const response = await fetch(this._tokenAuthApiPath);

    let res = await axios
      .post("https://eastus.api.cognitive.microsoft.com/sts/v1.0/issuetoken", {}, {
        headers: {
          'Content-Type': 'application/json',
          'Ocp-Apim-Subscription-Key': "82a2d69008b84bfc94e094416ecc3838"
        }
      })


    const response = await res.data;
    const azureToken = response
    return azureToken;
  }
}
function App() {
  const [recognizedTexts, setRecognizedTexts] = useState<any>("");
  const speech = new AzureCognitiveSpeech("/api/createAzureTokenRequest");

  const init = function () {
    console.log('calling')
    //doc
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(function (stream) {
        console.log('You let me use your mic!')
      })
      .catch(function (err) {
        console.log('No mic for you!')
      });
    //https://eastus.api.cognitive.microsoft.com/sts/v1.0/issuetoken

    speech.onTextRecognised((text: any) => {

      console.log('recoginzed text', text)
      // const colorValue = colorPicker.value ?? "#ffffff";
      // const speedValue = parseInt(speedSlider.value) * -1 ?? 25;
      var x = recognizedTexts + " " + text;
      setRecognizedTexts(x);
      // textPreview.scrollTop = textPreview.scrollHeight;

      // ledDriver.text.scroll(text, colorValue, speedValue);
    });
    speech.streamSpeechFromBrowser();
    //@ts-ignore
    document.getElementById('record-toggle').checked = true
  }
  const stop = async () => {
    //@ts-ignore
    document.getElementById('record-toggle').checked = false;
    speech.stopContinuousRecognitionAsync()
  }

  useEffect(() => {
    // init();
  }, [])
  return (<>
    {console.log("render", recognizedTexts)}
    <div className="App">
      <div className="frame">
        <input type="checkbox" name="toggle" id="record-toggle" />

        <svg viewBox="0 0 100 100">
          <circle cx="50%" cy="50%" r="45" className="circle-svg" />
        </svg>

        <div className="mic">
          <div className="mic__head"></div>
          <div className="mic__neck"></div>
          <div className="mic__leg"></div>
        </div>

        <div className="recording">
          <div className="round"></div>
          <div className="round"></div>
          <div className="round"></div>
        </div>

        {/* <label htmlFor="record-toggle" className="toggle-label"></label> */}
       
      </div>
      <div className="actionbtn">
          <button onClick={() => init()}>Start</button>
          <button onClick={() => stop()}>Stop</button>
        </div>
        <div className='caption'>

          <h2>Live Captions</h2>
          <ul>
            <li>{recognizedTexts}</li>
          </ul>
        </div>
    </div>
  </>
  );
}

export default App;
