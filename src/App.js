import React, { useState, useEffect, useRef } from "react";
import PdfUploader from "./components/PdfUploader";
import ChatComponent from "./components/ChatComponent";
import RenderQA from "./components/RenderQA";
import { Layout, Typography } from "antd";
import "./App.css";

const { Header, Content } = Layout;
const { Title, Text } = Typography;

const App = () => {
  const [conversation, setConversation] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef(null);

  const handleResp = (question, answer) => {
    setConversation((prev) => [...prev, { question, answer }]);
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation, isLoading]);

  return (
    <Layout className="app-layout">
      <Header className="app-header">
        <Title level={3} className="app-title">
          WildCats Agent AI
        </Title>
      </Header>

      <Content className="app-content">
        <div className="uploader-section">
          <PdfUploader />
        </div>

        <div className="conversation-section">
          {conversation.length === 0 && !isLoading && (
            <Text type="secondary" className="empty-hint">
              Upload a PDF, then ask a question below.
            </Text>
          )}
          <RenderQA conversation={conversation} isLoading={isLoading} />
          <div ref={bottomRef} />
        </div>
      </Content>

      <div className="input-bar">
        <ChatComponent
          handleResp={handleResp}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
        />
      </div>
    </Layout>
  );
};

export default App;
