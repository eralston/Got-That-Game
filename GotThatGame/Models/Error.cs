using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Runtime.Serialization;
using System.Xml;
using System.Xml.Serialization;
using System.Web;

namespace GotThatGame.Models
{
    /// <summary>
    /// Model for passing back errors via Steam web api
    /// </summary>
    [DataContract]
    public class Error
    {
        public Error()
        {
        }

        public Error(Exception ex)
        {
            this.ErrorText = ex.Message;
        }

        [DataMember]
        public string ErrorText { get; set; }
    }
}