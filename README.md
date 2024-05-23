## `dartscript`

Simple CLI utility for creacting a JavaScript module of a [Dart function](https://dart.dev/language/functions), _and only a function_.

> [!IMPORTANT]
> Requires running `dart compile js` with optimizations disabled `-O0`.

> [!IMPORTANT]
> Requires the Dart function to be called in `main()`.

## Example

Given a file with a Dart function

**greeting.dart**

```dart
String greeting() => 'Hello from Dart';

void main() {
    greeting();
}
```

Compile it _without optimizations_

```
dart compile js -O0 -o greeting.js greeting.dart
```

Pass it to `dartscript` providing the function name to convert to a JS module

```
dartscript --in greeting.js --out greet-func.js greeting
```

**greet-func.js**

```js
export function greeting() {
  return 'Hello from Dart'
}
```

## Options

- `--in` The output file from the Dart build (defaults to `out.js`)
- `--out` The name of the build file for `dartscript` to produce (defaults to `jsout.js`)
- `--module` The module system type, `es | cjs` (defaults to `es`)
- `--default` Whether to export the function using a default export for the module system
