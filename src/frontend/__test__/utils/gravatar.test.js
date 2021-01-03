import gravatar from '../../utils/gravatar';

test('', () => {
  const email = 'guerronc@outlook.com';
  const gravatarUrl =
    'https://gravatar.com/avatar/d983060fd7db6fe426ffc3bc82452e6e';

  expect(gravatarUrl).toEqual(gravatar(email));
});
