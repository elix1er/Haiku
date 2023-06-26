class DNAComponent {
  typename: string;

  constructor(typename: string) {
    this.typename = typename;
  }

  getTypename(): string {
    return this.typename;
  }
}

export { DNAComponent };