package com.kumar;

import java.rmi.RemoteException;

import org.apache.axis2.AxisFault;

import com.kumar.TempConverterStub.CelsiusToFarenheit;
import com.kumar.TempConverterStub.CelsiusToFarenheitResponse;
import com.kumar.TempConverterStub.FarenheitToCelsius;
import com.kumar.TempConverterStub.FarenheitToCelsiusResponse;

public class testClient {

        public static void main(String[] args) {
                try {
                        float celsiusValue = 100;
                        float farValue = 212;
                        TempConverterStub stub = new TempConverterStub();
                        CelsiusToFarenheit c2f = new CelsiusToFarenheit();
                        FarenheitToCelsius f2c = new FarenheitToCelsius();
                        c2f.setCel(celsiusValue);
                        f2c.setFar(farValue);
                        CelsiusToFarenheitResponse res = stub.celsiusToFarenheit(c2f);
                        FarenheitToCelsiusResponse res1 = stub.farenheitToCelsius(f2c);
                        System.out.println("Celsius : "+celsiusValue+" = "+"Farenheit : "+res.get_return());
                        System.out.println("Fahrenheit : "+farValue+" = "+"Celsius : "+res1.get_return());
                } catch (AxisFault e) {
                        e.printStackTrace();
                } catch (RemoteException e) {
                        e.printStackTrace();
                }

        }
}
