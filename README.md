## [`dartscript`](https://www.npmjs.com/package/dartscript)

[![NPM version](https://img.shields.io/npm/v/dartscript.svg)](https://www.npmjs.com/package/dartscript)

Simple CLI utility for creacting a JavaScript module of a [Dart function](https://dart.dev/language/functions).

## Requirements

You need to have the [Dart SDK installed](https://dart.dev/get-dart#choose-an-installation-option).

You need to wrap the function you want converted with [`allowInterop`](https://pub.dev/packages/js#making-a-dart-function-callable-from-javascript) from the [`dart:js`](https://api.dart.dev/stable/3.4.1/dart-js/dart-js-library.html) library within [`main()`](https://dart.dev/language/functions#the-main-function). This implies you need to `import package:js/js.dart` from the dart file passed to `dartscript`, and so will need to list it within your `pubspec.yaml` file:

```yaml
dependencies:
  js: ^0.7.1
```

## Example

Given a file with a Dart function (that possible calls another function)

**file.dart**

```dart
import 'package:js/js.dart';

@JS('greeting')
String greeting(String name) => '$name, hello from Dart!';

@JS('say')
String say(String from, String msg, [bool? greet]) {
  var result = '$from says $msg';

  if (greet != null && greet) {
    result = greeting('Welcome');
  }

  return result;
}

void main() {
  allowInterop(say);
}
```

Pass it to `dartscript` providing the function name to convert to a JS module

```
dartscript --func say --out say.js file.dart
```

**say.js**

```js
export function say(from, msg, greet) {
  var result = from + ' says ' + msg
  return greet === true ? 'Welcome, hello from Dart!' : result
}
```

## Options

You pass the name of the input Dart file as a positional.

- `--func` The name of the function from the Dart build to extract (required)
- `--out` The name of the build file for `dartscript` to produce (defaults to `func.js`)
- `--module` The module system type, `es | cjs` (defaults to `es`)
- `--default` Whether to export the function using a default export for the module system (defaults to `false`)
