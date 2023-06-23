class ECSComponent {
  typename: string;

  constructor(typename: string) {
    this.typename = typename;
  }

  getTypename(): string {
    return this.typename;
  }
}

export { ECSComponent };