variable "region" {
  description = "The AWS region to build the image in"
  type = string
}

variable "instance_type" {
  description = "The type of instance to use"
  type = string
}

variable "image_id" {
  description = "AMI ID of the base image"
  type = string
}

packer {
  required_plugins {
    amazon = {
      version = ">= 0.0.2"
      source  = "github.com/hashicorp/amazon"
    }
  }
}

source "amazon-ebs" "ubuntu" {
  ami_name      = "sccache-dist-ubuntu-aws"
  instance_type = var.instance_type
  region        = var.region
  source_ami_filter {
    filters = {
      image-id            = var.image_id
      root-device-type    = "ebs"
      virtualization-type = "hvm"
    }
    most_recent = true
    owners      = ["099720109477"] # account number for Canonical
  }

  ssh_username = "ubuntu"
}

build {
  name = "sccache-dist-ubuntu-aws"
  sources = [
    "source.amazon-ebs.ubuntu"
  ]

  provisioner "shell" {
    script = "setup.sh"
  }
}

