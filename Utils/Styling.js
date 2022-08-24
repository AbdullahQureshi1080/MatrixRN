import {Dimensions} from 'react-native';

const calculateWidth = size => {
  const width = Dimensions.get('window').width;
  switch (size) {
    case 'SMALL': {
      return '20%';
    }
    case 'MEDIUM': {
      return '75%';
    }
    case 'LARGE': {
      return '90%';
    }
    case 'MODAL': {
      return '60%';
    }
    case 'VERY_SMALL': {
      return '25%';
    }
  }
};

export {calculateWidth};
