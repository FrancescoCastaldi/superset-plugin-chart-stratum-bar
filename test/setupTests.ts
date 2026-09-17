if (typeof (global as any).window === 'undefined') {
  (global as any).window = global;
}
if (typeof (global as any).document === 'undefined') {
  (global as any).document = {
    createElement: () => ({}),
  };
}
