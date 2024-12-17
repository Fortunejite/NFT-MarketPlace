import React from "react";
import { Modal, Form, Input, Select, Button } from "antd";

interface MintNFTModalProps {
  visible: boolean;
  onClose: () => void;
  onMint: (values: { name: string; description: string; uri: string; rarity: number }) => void;
}

const MintNFTModal: React.FC<MintNFTModalProps> = ({ visible, onClose, onMint }) => {
  return (
    <Modal title="Mint New NFT" visible={visible} onCancel={onClose} footer={null}>
      <Form layout="vertical" onFinish={onMint}>
        <Form.Item
          label="Name"
          name="name"
          rules={[{ required: true, message: "Please enter a name!" }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          label="Description"
          name="description"
          rules={[{ required: true, message: "Please enter a description!" }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          label="URI"
          name="uri"
          rules={[{ required: true, message: "Please enter a URI!" }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          label="Rarity"
          name="rarity"
          rules={[{ required: true, message: "Please select a rarity!" }]}
        >
          <Select>
            <Select.Option value={1}>Common</Select.Option>
            <Select.Option value={2}>Uncommon</Select.Option>
            <Select.Option value={3}>Rare</Select.Option>
            <Select.Option value={4}>Epic</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit">
            Mint NFT
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default MintNFTModal;
