import { UserMapper } from "../UserMapper";
import { UserEntity } from "@/domain/entities/User";
import { UserModel } from "../models/MessageModel";

describe("UserMapper", () => {
  it("performs round-trip conversion", () => {
    const model: UserModel = {
      id: "user123",
      name: "John Doe",
      phone: "1234567890",
      avatar: "avatar.png",
      isOnline: true,
      lastSeen: "2026-01-01T12:00:00.000Z",
      status: "active",
      createdAt: "2026-01-01T12:00:00.000Z",
      updatedAt: "2026-01-01T12:00:00.000Z",
    };
    const domain = UserMapper.toDomain(model);
    const backModel = UserMapper.toModel(domain);
    expect(backModel).toEqual(model);
  });
});
