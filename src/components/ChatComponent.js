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

  // 🔧 用 ref 存最新 transcript，避免闭包问题
  const transcriptRef = useRef("");
  // 🔧 标记是否已经提交过，防止重复
  const submittedRef = useRef(false);

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
    isMicrophoneAvailable,
  } = useSpeechRecognition();

  // 同步 transcript 到 ref
  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  // 初始化语音合成
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
      .then((data) => {
        console.log("Speech is ready", data);
        setSpeech(initialized_speech);
      })
      .catch((e) => {
        console.error("Speech init error:", e);
      });
  }, []);

  // 🔧 核心改动：只在 listening 变 false 且还没提交过时，提交一次
  useEffect(() => {
    if (listening) {
      // 开始录音时重置标记
      submittedRef.current = false;
      return;
    }

    // listening 变 false，且还没提交过，且有内容
    if (!submittedRef.current && transcriptRef.current.trim()) {
      submittedRef.current = true;
      const text = transcriptRef.current.trim();
      console.log("Submitting once:", text); // 调试用
      onSearch(text);
      setIsRecording(false);
    }
  }, [listening]); // 🔧 只依赖 listening，不依赖 transcript

  const talk = useCallback((what2say) => {
    if (!speech) return;
    speech
      .speak({
        text: what2say,
        queue: false,
      })
      .then(() => {
        console.log("Speech finished");
        // 🔧 不再自动重听
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
      // 🔧 手动停止：先标记已提交，再停监听
      // 这样 useEffect 里不会重复提交
      submittedRef.current = true;
      SpeechRecognition.stopListening();
      setIsRecording(false);
      resetTranscript();
      transcriptRef.current = "";
    } else {
      // 开始录音：重置标记
      submittedRef.current = false;
      transcriptRef.current = "";
      resetTranscript();
      SpeechRecognition.startListening();
      setIsRecording(true);
    }
  };

  const onSearch = async (question) => {
    if (!question || !question.trim()) return;

    console.log("onSearch called with:", question); // 调试用
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