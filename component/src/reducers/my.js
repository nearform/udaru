const initialState = {

};

const my = (state = initialState, action) => {
  switch (action.type) {
    case 'SAMPLE_ACTION':
      return state;
    default:
      return state;
  }
};

export default my;
