type GreetingProps = {
  name: string;
  age: number;
};

function Greeting({ name, age }: GreetingProps) {
  return (
    <p>
      Hei {name}, olet {age} vuotta vanha.
    </p>
  );
}

export default Greeting;