import React from 'react';
import { connect } from 'react-redux';
import Search from '../components/Search';
import Categories from '../components/Categories';
import Carousel from '../components/Carousel';
import CarouselItem from '../components/CarouselItem';
import '../assets/styles/App.scss';

const Home = ({ mylist, trends, originals }) => {
  return (
    <>
      <Search isHome/>
      {mylist.length > 0 && (
        <Categories title='Mi lista'>
          <Carousel>
            {mylist.map((item) => (
              <CarouselItem
                key={item.id}
                {...item}
                isList
              />
            ))}
          </Carousel>
        </Categories>
      )}

      {trends.length > 0 && (
        <Categories title='Tendencias'>
          <Carousel>
            {trends.map((item) => (
              <CarouselItem
                key={item.id}
                {...item}
                isList={false}
              />
            ))}
          </Carousel>
        </Categories>
      )}

      {originals.length > 0 && (
        <Categories title='Originales de platzi Videos'>
          <Carousel>
            {originals.map((item) => (
              <CarouselItem
                key={item.id}
                {...item}
                isList={false}
              />
            ))}
          </Carousel>
        </Categories>
      )}
    </>
  );
};

const mapStateToProps = (state) => {
  return {
    mylist: state.mylist,
    trends: state.trends,
    originals: state.originals,
  };
};

export default connect(mapStateToProps, null)(Home);
