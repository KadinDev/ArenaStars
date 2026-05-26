import * as ImageManipulator from "expo-image-manipulator";

export async function compressPlayerImage(uri: string) {
  return ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 500 } }],
    {
      compress: 0.7,
      format: ImageManipulator.SaveFormat.JPEG
    }
  );
}
