package com.kumar;

public class TempConverter
{
  public float celsiusToFarenheit ( float cel )
  {
    return (cel * 9 / 5) + 32;
  }

  public float farenheitToCelsius ( float far )
  {
    return (far - 32) * 5 / 9;
  }
}