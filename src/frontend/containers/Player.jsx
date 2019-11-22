import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { Redirect } from 'react-router-dom';
import { getVideoSource } from '../actions';
import '../assets/styles/components/Player.scss';

const Player = (props) => {

  const { id } = props.match.params;
  const [loading, changeLoading] = useState(true);
  const hasPLaying = Object.keys(props.playing).length > 0;

  useEffect(() => {
    props.getVideoSource(id);
    changeLoading(false);
  }, null);

  return loading ?
    <h1>Loading</h1> :
    hasPLaying ? (
      <div className='Player'>
        <video controls autoPlay>
          <source src={props.playing.source} type='video/mp4' />
        </video>
        <div className='Player-back'>
          <button type='button' onClick={() => props.history.goBack()}>
                        Regresar
          </button>
        </div>
      </div>
    ) : (<Redirect to='/404' />);
};

const mapStateToProps = (state) => {
  return {
    playing: state.playing,
  };
};

const matDispatchToProps = {
  getVideoSource,
};

export default connect(mapStateToProps, matDispatchToProps)(Player);
