export class CollaboratorZaloGroupMissingError extends Error {
  constructor() {
    super(
      'Bạn chưa được thêm vào nhóm Zalo. Hãy liên hệ quản trị viên.',
    );
    this.name = 'CollaboratorZaloGroupMissingError';
  }
}
