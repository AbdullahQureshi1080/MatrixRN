const initialLoad = {
  error: '',
  errorVisible: '',
  loading: false,
};

function loadReducer(state, action) {
  switch (action.type) {
    case 'LOADING':
      return {...state, loading: action.payload};
    case 'SET_ERROR':
      return {...state, error: action.payload};
    case 'SET_ERROR_VISIBLE':
      return {...state, errorVisible: action.payload};
    default:
      return state;
  }
}

export {loadReducer, initialLoad};
