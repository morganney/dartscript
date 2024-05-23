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
