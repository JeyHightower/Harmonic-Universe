// Fallback implementation of prop-types
// Used when the real prop-types package fails to load

const createChainableTypeChecker = () => {
  function validate() {
    return null;
  }
  validate.isRequired = validate;
  return validate;
};

const PropTypes = {
  array: createChainableTypeChecker(),
  bool: createChainableTypeChecker(),
  func: createChainableTypeChecker(),
  number: createChainableTypeChecker(),
  object: createChainableTypeChecker(),
  string: createChainableTypeChecker(),
  symbol: createChainableTypeChecker(),
  node: createChainableTypeChecker(),
  element: createChainableTypeChecker(),
  instanceOf: () => createChainableTypeChecker(),
  oneOf: () => createChainableTypeChecker(),
  oneOfType: () => createChainableTypeChecker(),
  arrayOf: () => createChainableTypeChecker(),
  objectOf: () => createChainableTypeChecker(),
  shape: () => createChainableTypeChecker(),
  exact: () => createChainableTypeChecker(),
  any: createChainableTypeChecker(),
};

export default PropTypes; 