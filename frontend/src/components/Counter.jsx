import React from 'react';
import { Button, Flex, Text } from '@chakra-ui/react';

function Counter(props) {
  return (
    <div>
      <Flex align="center" justify="center">
        <Button colorScheme="teal" variant="outline" onClick={props.decrementCounter}>
          -
        </Button>
        <Text fontSize="xl" mx="4">
          {props.count}
        </Text>
        <Button colorScheme="teal" variant="outline" onClick={props.incrementCounter}>
          +
        </Button>
      </Flex>
      <Flex align="center" justify="center" mt="4">
        <Button colorScheme="gray" variant="solid" onClick={props.updateCounter} >
          Refresh
        </Button>
      </Flex>
    </div>
  );
}

export default Counter;
