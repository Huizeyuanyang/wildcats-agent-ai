import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { Button, Input } from "antd";
import { AudioOutlined } from "@ant-design/icons";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import Speech from "speak-tts";

const { Search } = Input;
const DOMAIN = "http://localhost:5001";

const searchContainer = {
  display: "flex",
  justifyContent: "center",
};

const ChatComponent = (props) => {
  const { handleResp, isLoading, setIsLoading } = props;
  const [searchValue, setSearchValue] = useState("");
  const [isChatModeOn, setIsChatModeOn] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [speech, setSpeech] = useState();

  // Keep the latest transcript in a ref so callbacks don't read a stale value
  const transcriptRef = useRef("");
  // Prevents submitting the same voice question twice
  const submittedRef = useRef(false);

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
    isMicrophoneAvailable,
  } = useSpeechRecognition();

  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  // Initialize text-to-speech
  useEffect(() => {
    const initialized_speech = new Speech();
    initialized_speech
      .init({
        volume: 1,
        lang: "en-US",
        rate: 1,
        pitch: 1,
        voice: "Google US English",
        splitSentences: false,
      })
      .then(() => {
        setSpeech(initialized_speech);
      })
      .catch((e) => {
        console.error("Speech init error:", e);
      });
  }, []);

  // When listening stops, submit the transcript once
  useEffect(() => {
    if (listening) {
      submittedRef.current = false;
      return;
    }

    if (!submittedRef.current && transcriptRef.current.trim()) {
      submittedRef.current = true;
      const text = transcriptRef.current.trim();
      onSearch(text);
      setIsRecording(false);
    }
  }, [listening]);

  const talk = useCallback((what2say) => {
    if (!speech) return;
    speech
      .speak({
        text: what2say,
        queue: false,
      })
      .catch((e) => {
        console.error("Speech error:", e);
      });
  }, [speech]);

  const chatModeClickHandler = () => {
    setIsChatModeOn(!isChatModeOn);
    setIsRecording(false);
    SpeechRecognition.stopListening();
    resetTranscript();
    transcriptRef.current = "";
    submittedRef.current = false;
  };

  const recordingClickHandler = () => {
    if (isRecording) {
      // Manual stop: mark as submitted first so the effect above doesn't submit
      submittedRef.current = true;
      SpeechRecognition.stopListening();
      setIsRecording(false);
      resetTranscript();
      transcriptRef.current = "";
    } else {
      submittedRef.current = false;
      transcriptRef.current = "";
      resetTranscript();
      SpeechRecognition.startListening();
      setIsRecording(true);
    }
  };

  const onSearch = async (question) => {
    if (!question || !question.trim()) return;

    setSearchValue("");
    setIsLoading(true);

    try {
      const response = await axios.get(`${DOMAIN}/chat`, {
        params: { question },
      });
      handleResp(question, response.data);
      if (isChatModeOn && response.data?.ragAnswer) {
        talk(response.data.ragAnswer);
      }
    } catch (error) {
      console.error(`Error: ${error}`);
      handleResp(question, error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    setSearchValue(e.target.value);
  };

  return (
    <div style={searchContainer}>
      {!isChatModeOn && (
        <Search
          placeholder="input search text"
          enterButton="Ask"
          size="large"
          onSearch={onSearch}
          loading={isLoading}
          value={searchValue}
          onChange={handleChange}
        />
      )}
      <Button
        type="primary"
        size="large"
        danger={isChatModeOn}
        onClick={chatModeClickHandler}
        style={{ marginLeft: "5px" }}
      >
        Chat Mode: {isChatModeOn ? "On" : "Off"}
      </Button>
      {isChatModeOn && (
        <Button
          type="primary"
          icon={<AudioOutlined />}
          size="large"
          danger={isRecording}
          onClick={recordingClickHandler}
          style={{ marginLeft: "5px" }}
        >
          {isRecording ? "Recording..." : "Click to record"}
        </Button>
      )}
    </div>
  );
};

export default ChatComponent;