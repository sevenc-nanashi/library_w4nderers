export const useGraphicsContext = (p: {
  push: () => void;
  pop: () => void;
}) => {
  p.push();
  return {
    [Symbol.dispose]() {
      p.pop();
    },
  };
};
