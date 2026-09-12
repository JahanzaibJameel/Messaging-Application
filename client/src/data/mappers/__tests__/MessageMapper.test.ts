import { MessageMapper } from "../MessageMapper";
import { MessageModel } from "../models/MessageModel";

describe("MessageMapper", () => {
  it("performs round-trip conversion", () => {
    const model: MessageModel = {
      id: "msg123",
      chatId: "chat123",
      senderId: "user123",
      type: "text",
      text: "Hello world",
      attachment: undefined,
      timestamp: "2026-01-01T12:00:00.000Z",
      status: "sent",
      replyTo: undefined,
      reactions: [],
      edited: false,
      editedAt: "2026-01-01T12:00:00.000Z",
      metadata: {},
      localOnly: false,
      retryCount: 0,
    };
    const domain = MessageMapper.toDomain(model);
    const backModel = MessageMapper.toModel(domain);
    expect(backModel).toEqual(model);
  });
});
