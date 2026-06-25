// CSS imported with `?inline` resolves to the compiled stylesheet as a string,
// which we inject into the content-script shadow root.
declare module '*.css?inline' {
  const css: string;
  export default css;
}
