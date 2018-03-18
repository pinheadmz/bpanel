// Dashboard widget for showing mempool information

import { Header, Button } from '@bpanel/bpanel-ui';

import {
  ADD_RECENT_BLOCK,
  UPDATE_MEMPOOL,
  MEMPOOL_TX,
  SOCKET_CONNECTED
} from './constants';
import {
  broadcastSetFilter,
  subscribeTX,
  updateMempool,
  watchMempool
} from './actions';

export const metadata = {
  name: 'mempool',
  author: 'bcoin-org'
};

export const mapComponentState = {
  Panel: (state, map) =>
    Object.assign(map, {
      mempoolTx: state.node.mempool.tx,
      mempoolSize: state.node.mempool.size
    })
};

export const addSocketConstants = (sockets = { listeners: [] }) => {
  sockets.listeners.push(
    {
      event: 'update mempool',
      actionType: UPDATE_MEMPOOL
    },
    {
      event: 'mempool tx',
      actionType: MEMPOOL_TX
    }
  );
  return Object.assign(sockets, {
    socketListeners: sockets.listeners
  });
};

export const reduceNode = (state, action) => {
  const { type, payload } = action;

  switch (type) {
    case UPDATE_MEMPOOL: {
      const { tx, size } = payload;
      const currentTx = state.getIn('tx');
      const currentSize = state.getIn('size');

      if (tx !== currentTx && size !== currentSize) {
        return state.set('mempool', payload);
      }
      break;
    }

    default:
      return state;
  }
};

export const getRouteProps = {
  '@bpanel/dashboard': (parentProps, props) =>
    Object.assign(props, {
      mempoolTx: parentProps.mempoolTx,
      mempoolSize: parentProps.mempoolSize
    })
};

const debounceInterval = 1000;
let deboucer = null;
export const middleware = ({ dispatch }) => next => action => {
  const { type } = action;
  if (type === SOCKET_CONNECTED) {
    // actions to dispatch when the socket has connected
    // these are broadcasts and subscriptions we want to make
    // to the bcoin node
    dispatch(watchMempool());
    dispatch(broadcastSetFilter());
    dispatch(subscribeTX());
  } else if (type === MEMPOOL_TX || type === ADD_RECENT_BLOCK) {
    if (deboucer) return next(action);
    // update mempool state if new tx in pool or we got a new block
    dispatch(updateMempool());
    deboucer = setTimeout(() => {
      deboucer = null;
    }, debounceInterval);
  }
  return next(action);
};

// very/exactly similar to normal decorators
// name can be anything, but must match it to target
// plugin name via decoratePlugin export below
const decorateDashboard = (Dashboard, { React, PropTypes }) => {
  return class extends React.Component {
    constructor(props) {
      super(props);
    }

    static displayName() {
      return 'mempoolWidget';
    }

    static get propTypes() {
      return {
        bottomWidgets: PropTypes.node,
        mempoolSize: PropTypes.number,
        mempoolTx: PropTypes.number
      };
    }

    justKidding() {
      alert('Just Kidding!');
    }

    render() {
      const bottomWidgets = (
        <div>
          <Header type="h5"> Current Mempool</Header>
          <p>Mempool TX: {this.props.mempoolTx}</p>
          <p>Mempool Size: {this.props.mempoolSize}</p>
          <Button onClick={() => this.justKidding()}>
            Make Transactions Cheaper
          </Button>
          {this.props.bottomWidgets}
        </div>
      );

      return <Dashboard {...this.props} bottomWidgets={bottomWidgets} />;
    }
  };
};

// `decoratePlugin` passes an object with properties to map to the
// plugins they will decorate. Must match target plugin name exactly
export const decoratePlugin = { '@bpanel/dashboard': decorateDashboard };
