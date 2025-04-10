type Label = string;

// In the POPL paper, both Variants and Records
// are constructed from rows, with the type constructors Pi and Sigma.
// In this representation, the most convenient way to represent a Row is as a record,
// and since the type "Record" is already defined in typescript,
// we will use "Row" to represent both the ground row and its corresponding record type.
type Row<Labels extends Label = never> = Record<Labels, unknown>;

type Variant<R extends Row> = {
  [tag in keyof R]: { tag: tag; value: R[tag] };
}[keyof R];

type SomeVariant = Variant<Row>;

type HandlerMap<R extends Row, T> = {
  [tag in keyof R]: (arg: R[tag]) => T;
};

type VariantFunction<R extends Row, T> = (value: Variant<R>) => T;

type VariantFunctionConstructor = <R extends Row, T>(
  handlers: HandlerMap<R, T>
) => // Note that V is in contravariant position in VariantFunction<V,T>
VariantFunction<R, T>;

type ExampleRow = {
  str: string;
  n: number;
  empty: null;
};

type ExampleVariant = Variant<ExampleRow>;

type Equals<T, U> = T extends U ? (U extends T ? true : never) : never;

const variantProof: Equals<
  Variant<ExampleRow>,
  | { tag: "str"; value: string }
  | { tag: "n"; value: number }
  | { tag: "empty"; value: null }
> = true;

const isEmptyHandlerMap: HandlerMap<ExampleRow, boolean> = {
  str: (_v: string) => false,
  n: (_v: number) => false,
  empty: (_v: null) => true,
};

const getVariantFunction: VariantFunctionConstructor =
  <R extends Row, V extends Variant<R>, T>(handlers: HandlerMap<R, T>) =>
  (v: V): T => {
    const handler = handlers[v.tag];
    // I'm pretty sure this isn't actually checked properly.
    // The association between v.tag as the discriminant and v.value as the value for that case isn't tracked in the types.
    // as we can see with the more concrete types in the next definition.
    return handler(v.value);
  };

const isEmpty: VariantFunction<ExampleRow, boolean> = (
  v: ExampleVariant
): boolean => {
  // When checking the concrete types, the handler type is correctly inferred
  // as the union of the types of the handler function
  const handler = isEmptyHandlerMap[v.tag];
  // However, the typechecker does not know that "v.value" must be the corresponding argument type.
  // @ts-expect-error
  return handler(v.value);
};
